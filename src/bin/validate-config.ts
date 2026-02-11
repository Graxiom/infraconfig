#!/usr/bin/env node
/**
 * Configuration Validator
 * 
 * Validates infra-config.json structure and reports issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { InfraConfig } from '../types';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
}

export function validate(configPath: string): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // Check file exists
  if (!fs.existsSync(configPath)) {
    issues.push({
      severity: 'error',
      path: configPath,
      message: 'Configuration file not found'
    });
    return { valid: false, issues };
  }

  // Parse JSON
  let config: InfraConfig;
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch (error) {
    issues.push({
      severity: 'error',
      path: configPath,
      message: `Invalid JSON: ${(error as Error).message}`
    });
    return { valid: false, issues };
  }

  // Validate structure
  if (!config.schemaVersion) {
    issues.push({
      severity: 'warning',
      path: 'schemaVersion',
      message: 'Missing schemaVersion field'
    });
  }

  if (!config.systems || !Array.isArray(config.systems)) {
    issues.push({
      severity: 'error',
      path: 'systems',
      message: 'Missing or invalid systems array'
    });
    return { valid: false, issues };
  }

  // Validate each system
  config.systems.forEach((system, sysIndex) => {
    const sysPath = `systems[${sysIndex}]`;

    if (!system.systemId) {
      issues.push({
        severity: 'error',
        path: `${sysPath}.systemId`,
        message: 'Missing systemId'
      });
    }

    if (!system.components || !Array.isArray(system.components)) {
      issues.push({
        severity: 'error',
        path: `${sysPath}.components`,
        message: 'Missing or invalid components array'
      });
      return;
    }

    // Validate each component
    system.components.forEach((component, compIndex) => {
      const compPath = `${sysPath}.components[${compIndex}]`;

      if (!component.componentId) {
        issues.push({
          severity: 'error',
          path: `${compPath}.componentId`,
          message: 'Missing componentId'
        });
      }

      if (!component.deployment) {
        issues.push({
          severity: 'error',
          path: `${compPath}.deployment`,
          message: 'Missing deployment configuration'
        });
        return;
      }

      const dep = component.deployment;
      const depPath = `${compPath}.deployment`;

      // Check for deprecated fields
      const deprecated: Record<string, string> = {
        'postgresHost': 'Use mariadbHost instead',
        'postgresPort': 'Use mariadbPort instead',
        'postgresUser': 'Use mariadbUser instead',
        'postgresPassword': 'Use mariadbPassword instead',
        'postgresDb': 'Use mariadbDatabase instead',
        'mysqlHost': 'Use mariadbHost instead',
        'mysqlPort': 'Use mariadbPort instead',
        'mysqlUser': 'Use mariadbUser instead',
        'mysqlPassword': 'Use mariadbPassword instead',
        'mysqlDatabase': 'Use mariadbDatabase instead',
        'mariadbDb': 'Use mariadbDatabase (full word) instead',
        'corsOrigins': 'Use corsOrigin (singular) instead',
        'iamApiUrl': 'Use infraIamBaseUrl instead',
        'apiUrl': 'Use apiBaseUrl instead'
      };

      for (const [field, suggestion] of Object.entries(deprecated)) {
        if ((dep as any)[field] !== undefined) {
          issues.push({
            severity: 'warning',
            path: `${depPath}.${field}`,
            message: `Deprecated field. ${suggestion}`
          });
        }
      }

      // Validate required fields for AGENT components
      if (component.componentType === 'AGENT') {
        if (!dep.port) {
          issues.push({
            severity: 'error',
            path: `${depPath}.port`,
            message: 'Missing required field: port'
          });
        }

        // Database Specification Rules
        if (dep.databaseUsageMode) {
          if (!['LOCAL', 'SHARED', 'NONE'].includes(dep.databaseUsageMode)) {
            issues.push({
              severity: 'error',
              path: `${depPath}.databaseUsageMode`,
              message: 'Invalid databaseUsageMode. Must be LOCAL, SHARED, or NONE'
            });
          }

          // Rule 4: Connection Authority (LOCAL)
          if (dep.databaseUsageMode === 'LOCAL') {
            if (!dep.dbLocalUrl) {
              issues.push({
                severity: 'error',
                path: `${depPath}.dbLocalUrl`,
                message: 'dbLocalUrl is required for LOCAL usage mode'
              });
            }
            if (!dep.dbNetworkKey) {
              issues.push({
                severity: 'error',
                path: `${depPath}.dbNetworkKey`,
                message: 'dbNetworkKey is required for LOCAL usage mode'
              });
            }
          }

          // Rule 2 & 4: Network Visibility & Consumption (SHARED)
          if (dep.databaseUsageMode === 'SHARED') {
            if (!dep.dbNetworkKey) {
              issues.push({
                severity: 'error',
                path: `${depPath}.dbNetworkKey`,
                message: 'dbNetworkKey is required for SHARED usage mode'
              });
            }
            if (dep.dbLocalUrl) {
              issues.push({
                severity: 'error',
                path: `${depPath}.dbLocalUrl`,
                message: 'dbLocalUrl must not be defined for SHARED usage mode'
              });
            }
          }

          // Rule 3: NONE
          if (dep.databaseUsageMode === 'NONE') {
            if (dep.dbLocalUrl || dep.dbNetworkKey) {
              issues.push({
                severity: 'warning',
                path: `${depPath}`,
                message: 'Database fields present but usage mode is NONE'
              });
            }
          }
        }

        // If any mariadb field exists, validate all are present
        const hasMariadbFields = dep.mariadbHost || dep.mariadbPort || dep.mariadbUser;
        if (hasMariadbFields) {
          if (!dep.mariadbHost) {
            issues.push({
              severity: 'error',
              path: `${depPath}.mariadbHost`,
              message: 'mariadbHost required when using MariaDB'
            });
          }
          if (!dep.mariadbPort) {
            issues.push({
              severity: 'error',
              path: `${depPath}.mariadbPort`,
              message: 'mariadbPort required when using MariaDB'
            });
          }
          if (!dep.mariadbUser) {
            issues.push({
              severity: 'error',
              path: `${depPath}.mariadbUser`,
              message: 'mariadbUser required when using MariaDB'
            });
          }
          if (!dep.mariadbPassword) {
            issues.push({
              severity: 'warning',
              path: `${depPath}.mariadbPassword`,
              message: 'mariadbPassword not set (may be intentional for testing)'
            });
          }
          if (!dep.mariadbDatabase) {
            issues.push({
              severity: 'error',
              path: `${depPath}.mariadbDatabase`,
              message: 'mariadbDatabase required when using MariaDB'
            });
          }
        }
      }

      // Validate WEB components
      if (component.componentType === 'WEB') {
        if (!dep.port) {
          issues.push({
            severity: 'error',
            path: `${depPath}.port`,
            message: 'Missing required field: port'
          });
        }
        if (!dep.apiBaseUrl) {
          issues.push({
            severity: 'warning',
            path: `${depPath}.apiBaseUrl`,
            message: 'WEB components typically need apiBaseUrl to connect to AGENT'
          });
        }
      }
    });
  });

  const hasErrors = issues.some(i => i.severity === 'error');
  return { valid: !hasErrors, issues };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: validate-config <config-path>

Arguments:
  config-path     Path to infra-config.json file

Examples:
  validate-config ./infra-config.json
`);
    process.exit(0);
  }

  const configPath = path.resolve(args[0]);
  const result = validate(configPath);

  // Group issues by severity
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const infos = result.issues.filter(i => i.severity === 'info');

  // Print results
  if (errors.length > 0) {
    console.error('\n❌ ERRORS:');
    errors.forEach(issue => {
      console.error(`  ${issue.path}: ${issue.message}`);
    });
  }

  if (warnings.length > 0) {
    console.error('\n⚠️  WARNINGS:');
    warnings.forEach(issue => {
      console.error(`  ${issue.path}: ${issue.message}`);
    });
  }

  if (infos.length > 0) {
    console.error('\nℹ️  INFO:');
    infos.forEach(issue => {
      console.error(`  ${issue.path}: ${issue.message}`);
    });
  }

  if (result.valid) {
    console.error('\n✅ Configuration is valid');
    if (warnings.length > 0) {
      console.error(`   ${warnings.length} warning(s) - consider fixing for best practices`);
    }
    process.exit(0);
  } else {
    console.error(`\n❌ Configuration has ${errors.length} error(s)`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
