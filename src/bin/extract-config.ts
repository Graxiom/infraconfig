#!/usr/bin/env node
/**
 * Universal Configuration Extractor
 * 
 * Extracts deployment configuration from infra-config.json and generates environment variables.
 * 
 * Features:
 * - Auto-discovers components (no hardcoding)
 * - MariaDB standardization
 * - Consistent field naming
 * - All config from JSON (no defaults in code)
 * - Clear error messages
 */

import * as fs from 'fs';
import * as path from 'path';
import { InfraConfig, Component, DeploymentConfig, ExtractedConfig, ExtractOptions } from '../types';
import { normalizeDeploymentConfig } from '../normalize-deployment';

/**
 * Auto-discover component from environment or config
 */
function discoverComponent(config: InfraConfig, options: ExtractOptions): { component: Component; systemId: string; systemType: string } {
  // Try explicit componentId from options or environment
  const targetComponentId = options.componentId || process.env.COMPONENT_ID || process.env.TARGET_COMPONENT_ID;
  const targetSystemId = options.systemId || process.env.SYSTEM_ID || process.env.TARGET_SYSTEM_ID;

  if (!config.systems || config.systems.length === 0) {
    throw new Error('No systems found in infra-config.json');
  }

  // Strategy 1: Find by explicit IDs
  if (targetSystemId && targetComponentId) {
    const system = config.systems.find(s => s.systemId === targetSystemId);
    if (!system) {
      throw new Error(`System '${targetSystemId}' not found in infra-config.json`);
    }
    const component = system.components.find(c => c.componentId === targetComponentId);
    if (!component) {
      throw new Error(`Component '${targetComponentId}' not found in system '${targetSystemId}'`);
    }
    return { component, systemId: system.systemId, systemType: system.systemType };
  }

  // Strategy 2: Find by componentId across all systems
  if (targetComponentId) {
    for (const system of config.systems) {
      const component = system.components.find(c => c.componentId === targetComponentId);
      if (component) {
        return { component, systemId: system.systemId, systemType: system.systemType };
      }
    }
    throw new Error(`Component '${targetComponentId}' not found in any system`);
  }

  // Strategy 3: Find first enabled AGENT component
  for (const system of config.systems) {
    const component = system.components.find(c => c.enabled !== false && c.componentType === 'AGENT');
    if (component) {
      console.error(`INFO: Auto-discovered component: ${component.componentId} in system ${system.systemId}`);
      return { component, systemId: system.systemId, systemType: system.systemType };
    }
  }

  // Strategy 4: Just use first component of first system
  const system = config.systems[0];
  const component = system.components[0];
  console.error(`WARN: Using first available component: ${component.componentId} in system ${system.systemId}`);
  return { component, systemId: system.systemId, systemType: system.systemType };
}

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE for environment variables
 */
function toEnvVarName(key: string): string {
  return key
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
}

/**
 * Extract environment variables from deployment config
 */
function extractEnvVars(deployment: DeploymentConfig): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Fields that should be expanded into individual variables
  const EXPANDABLE_FIELDS = ['moduleUrls', 'moduleApiBaseUrls'];

  // Convert all deployment fields to environment variables
  for (const [key, value] of Object.entries(deployment)) {
    if (value !== null && value !== undefined) {
      const envKey = toEnvVarName(key);
      
      // Handle complex types
      if (typeof value === 'object') {
        // Special handling: expand moduleUrls and moduleApiBaseUrls into VITE_* variables
        if (EXPANDABLE_FIELDS.includes(key) && value && typeof value === 'object' && !Array.isArray(value)) {
          for (const [moduleKey, moduleValue] of Object.entries(value)) {
            // moduleUrls.iam → VITE_IAM_URL
            // moduleApiBaseUrls.config → VITE_CONFIG_API_BASE_URL
            let expandedKey: string;
            if (key === 'moduleUrls') {
              expandedKey = `VITE_${moduleKey.toUpperCase()}_URL`;
            } else if (key === 'moduleApiBaseUrls') {
              expandedKey = `VITE_${moduleKey.toUpperCase()}_API_BASE_URL`;
            } else {
              continue;
            }
            envVars[expandedKey] = String(moduleValue);
          }
        } else {
          // Other objects: keep as JSON
          envVars[envKey] = JSON.stringify(value);
        }
      } else if (typeof value === 'boolean') {
        envVars[envKey] = value ? 'true' : 'false';
      } else {
        envVars[envKey] = String(value);
      }
    }
  }

  return envVars;
}

/**
 * Validate required parameters
 */
function validateRequiredParams(component: Component, systemType: string): string[] {
  const warnings: string[] = [];
  const deployment = normalizeDeploymentConfig(component.deployment);

  // Core parameters (all components)
  if (!deployment.port) {
    warnings.push('WARN: Missing required parameter: deployment.port');
  }

  // Component-type specific validation
  if (component.componentType === 'AGENT') {
    // AGENT components typically need database
    if (deployment.mariadbHost || deployment.mariadbPort || deployment.mariadbUser) {
      // If any DB field exists, all should exist
      if (!deployment.mariadbHost) warnings.push('WARN: mariadbHost is missing but other DB fields present');
      if (!deployment.mariadbPort) warnings.push('WARN: mariadbPort is missing but other DB fields present');
      if (!deployment.mariadbUser) warnings.push('WARN: mariadbUser is missing but other DB fields present');
      if (!deployment.mariadbPassword) warnings.push('WARN: mariadbPassword is missing but other DB fields present');
      if (!deployment.mariadbDatabase) warnings.push('WARN: mariadbDatabase is missing but other DB fields present');
    }
    // Database Usage Specification Validation
    if (deployment.databaseUsageMode) {
      const mode = deployment.databaseUsageMode;
      
      if (!['LOCAL', 'SHARED', 'NONE'].includes(mode)) {
        warnings.push(`WARN: Invalid databaseUsageMode '${mode}'. Must be LOCAL, SHARED, or NONE`);
      }

      if (mode === 'LOCAL') {
        if (!deployment.localDatabaseUrl) warnings.push('WARN: localDatabaseUrl is required for LOCAL usage mode');
      }

      if (mode === 'SHARED') {
        const hasDirectMariadbConnection = !!(
          deployment.mariadbHost &&
          deployment.mariadbPort &&
          deployment.mariadbUser &&
          deployment.mariadbDatabase
        );
        if (!deployment.sharedDatabaseDeploymentKey && !hasDirectMariadbConnection) {
          warnings.push(
            'WARN: For SHARED usage mode, provide sharedDatabaseDeploymentKey OR provide direct MariaDB connection fields (mariadbHost/mariadbPort/mariadbUser/mariadbDatabase)'
          );
        }
      }

      if (mode === 'NONE') {
        const hasDbFields = !!(
          deployment.localDatabaseUrl ||
          deployment.sharedDatabaseDeploymentKey ||
          deployment.mariadbHost ||
          deployment.mariadbPort ||
          deployment.mariadbUser ||
          deployment.mariadbPassword ||
          deployment.mariadbDatabase
        );
        if (hasDbFields) {
          warnings.push('WARN: Database fields present but usage mode is NONE');
        }
      }
    }  }

  // Check for deprecated fields
  const deprecatedFields = [
    'postgresHost', 'postgresPort', 'postgresUser', 'postgresPassword', 'postgresDb',
    'mysqlHost', 'mysqlPort', 'mysqlUser', 'mysqlPassword', 'mysqlDatabase',
    'mariadbDb', 'corsOrigins'
  ];

  for (const field of deprecatedFields) {
    if ((deployment as any)[field] !== undefined) {
      warnings.push(`WARN: Deprecated field '${field}' found. Please migrate to standard field name.`);
    }
  }

  return warnings;
}

/**
 * Main extraction function
 */
export function extractConfig(options: ExtractOptions): ExtractedConfig {
  // Read and parse config file
  if (!fs.existsSync(options.configPath)) {
    throw new Error(`Configuration file not found: ${options.configPath}`);
  }

  const configContent = fs.readFileSync(options.configPath, 'utf-8');
  let config: InfraConfig;

  try {
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Failed to parse infra-config.json: ${(error as Error).message}`);
  }

  // Discover component
  const { component, systemId, systemType } = discoverComponent(config, options);

  const deployment = normalizeDeploymentConfig(component.deployment);

  // Validate
  const warnings = validateRequiredParams(component, systemType);

  // Extract environment variables
  const envVars = extractEnvVars(deployment);

  // Compatibility env var aliases (legacy scripts)
  if (envVars.LOCAL_DATABASE_URL && !envVars.DB_LOCAL_URL) {
    envVars.DB_LOCAL_URL = envVars.LOCAL_DATABASE_URL;
  }
  if (envVars.SHARED_DATABASE_DEPLOYMENT_KEY && !envVars.DB_NETWORK_KEY) {
    envVars.DB_NETWORK_KEY = envVars.SHARED_DATABASE_DEPLOYMENT_KEY;
  }
  if (envVars.GITHUB_REPO && !envVars.REPO) {
    envVars.REPO = envVars.GITHUB_REPO;
  }
  if (envVars.GITHUB_BRANCH && !envVars.BRANCH) {
    envVars.BRANCH = envVars.GITHUB_BRANCH;
  }
  if (envVars.GITHUB_COMMIT && !envVars.COMMIT) {
    envVars.COMMIT = envVars.GITHUB_COMMIT;
  }

  // Add metadata
  envVars.SYSTEM_ID = systemId;
  envVars.SYSTEM_TYPE = systemType;
  envVars.COMPONENT_ID = component.componentId;
  envVars.COMPONENT_TYPE = component.componentType;
  if (config.version) {
    envVars.INFRA_CONFIG_VERSION = String(config.version);
  }
  if (config.environment) {
    envVars.INFRA_ENVIRONMENT = config.environment;
    envVars.ENVIRONMENT = config.environment; // For docker-compose compatibility
  }

  // Compatibility mappings for legacy field names
  if (envVars.OIDC_REDIRECT_URI && !envVars.OIDC_GUI_REDIRECT_URIS) {
    envVars.OIDC_GUI_REDIRECT_URIS = envVars.OIDC_REDIRECT_URI;
  }

  return {
    componentId: component.componentId,
    systemId,
    systemType,
    componentType: component.componentType,
    endpoint: component.endpoint,
    envVars,
    warnings
  };
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: extract-config <config-path> [component-id] [options]

Arguments:
  config-path     Path to infra-config.json file
  component-id    Component ID to extract (optional - will auto-discover)

Options:
  --output, -o    Output file path (default: stdout)
  --validate      Only validate, don't extract
  --help, -h      Show this help

Environment Variables:
  COMPONENT_ID    Component to extract (alternative to CLI arg)
  SYSTEM_ID       System containing the component (optional)

Examples:
  # Auto-discover component
  extract-config ./infra-config.json > .env.deployment

  # Extract specific component
  extract-config ./infra-config.json infra-iam-a > .env.deployment

  # Use environment variable
  COMPONENT_ID=infra-iam-a extract-config ./infra-config.json > .env.deployment

  # Validate only
  extract-config ./infra-config.json --validate
`);
    process.exit(0);
  }

  const configPath = path.resolve(args[0]);
  const componentId = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
  const validateOnly = args.includes('--validate');
  const outputIndex = args.indexOf('--output') >= 0 ? args.indexOf('--output') : args.indexOf('-o');
  const outputPath = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : undefined;

  try {
    const result = extractConfig({
      configPath,
      componentId,
      validateOnly
    });

    // Show warnings
    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => console.error(warn));
    }

    if (validateOnly) {
      console.error(`✓ Configuration valid for ${result.componentId}`);
      process.exit(0);
    }

    // Generate output
    const lines: string[] = [];
    lines.push('# Generated by @pharma/infraconfig');
    lines.push(`# Component: ${result.componentId}`);
    lines.push(`# System: ${result.systemId} (${result.systemType})`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Sort keys for consistent output
    const sortedKeys = Object.keys(result.envVars).sort();
    for (const key of sortedKeys) {
      lines.push(`${key}=${result.envVars[key]}`);
    }

    const output = lines.join('\n');

    // Write output
    if (outputPath) {
      fs.writeFileSync(outputPath, output, 'utf-8');
      console.error(`✓ Configuration extracted to ${outputPath}`);
    } else {
      console.log(output);
    }

    console.error(`✓ SUCCESS: Extracted configuration for ${result.componentId}`);
    process.exit(0);
  } catch (error) {
    console.error(`ERROR: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
