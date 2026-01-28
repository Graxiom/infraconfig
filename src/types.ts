/**
 * Standard Infrastructure Configuration Schema
 * 
 * This schema defines the official structure for all infrastructure configurations.
 * All services MUST follow this schema to ensure consistency.
 */

export interface InfraConfig {
  schemaVersion: string;
  environment: string;
  version?: number;
  status?: string;
  generatedBy?: {
    tool: string;
    generatedAtUtc: string;
  };
  promotedAtUtc?: string;
  systems: System[];
  installerInputs?: any; // Legacy field, not used by extractor
  contentHash?: string;
}

export interface System {
  systemId: string;
  systemType: string;
  components: Component[];
}

export interface Component {
  componentId: string;
  componentType: 'AGENT' | 'WEB';
  endpoint?: string;
  enabled?: boolean;
  deployment: DeploymentConfig;
}

/**
 * Standard Deployment Configuration
 * 
 * MariaDB Only - No PostgreSQL or MySQL fields
 * Consistent naming - corsOrigin (singular), mariadbDatabase (not Db)
 */
export interface DeploymentConfig {
  // Core service configuration (ALL components)
  port: number;
  host?: string;
  nodeEnv?: string;
  logLevel?: string;
  corsOrigin?: string;  // SINGULAR, not plural

  // MariaDB configuration (components with database)
  mariadbHost?: string;
  mariadbPort?: number;
  mariadbUser?: string;
  mariadbPassword?: string;
  mariadbDatabase?: string;  // Not "Db" or "mysql*"
  mariadbRootPassword?: string;
  mariadbSslEnabled?: boolean;
  mariadbSslRejectUnauthorized?: boolean;
  mariadbMaxConnections?: number;
  mariadbPoolMin?: number;
  mariadbPoolMax?: number;

  // Inter-service URLs (standardized naming: {service}BaseUrl)
  infraIamBaseUrl?: string;
  infraImBaseUrl?: string;
  infraConfigBaseUrl?: string;
  infraSecurityBaseUrl?: string;
  apiBaseUrl?: string;  // For WEB components pointing to their AGENT

  // Authentication & Security
  jwtSecret?: string;
  jwtAlgorithm?: string;
  jwtPublicKeyPath?: string;  // Alternative to jwtSecret
  jwtExpiresIn?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcRedirectUri?: string;
  oidcAllowedScopes?: string;
  cookieSecure?: boolean;

  // Encryption keys (IAM-specific)
  refreshTokenEncKey?: string;
  mfaEncKey?: string;
  scimSharedSecret?: string;
  dataShareSecret?: string;

  // Bearer tokens for service-to-service auth
  infraImBearerToken?: string;

  // Bootstrap configuration
  allowDevAdminSeed?: boolean;
  bootstrapOidcClientId?: string;
  bootstrapOidcRedirectUris?: string;
  bootstrapOidcAllowedScopes?: string;
  bootstrapOidcClientSecret?: string;

  // mTLS configuration
  mtlsEnabled?: boolean;
  mtlsCertPath?: string;
  mtlsKeyPath?: string;
  mtlsCaPath?: string;

  // Message queue configuration
  natsUrl?: string;
  natsClientName?: string;
  natsStreamName?: string;
  natsConsumerName?: string;
  natsSubjectInbound?: string;
  natsClientPort?: number;
  natsHttpPort?: number;

  // Redis configuration
  redisUrl?: string;
  redisMaxRetries?: number;
  redisConnectTimeout?: number;
  redisMaxmemory?: string;

  // Cache configuration
  cacheTtlSeconds?: number;
  cacheTtlMaterials?: number;
  cacheTtlRecipes?: number;
  cacheTtlEquipment?: number;
  cacheTtlBoms?: number;
  cacheTtlSearch?: number;
  cacheTtlValidation?: number;
  cacheKeyPrefix?: string;

  // Rate limiting
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
  rateLimitApi?: number;
  rateLimitBulk?: number;
  rateLimitExport?: number;

  // Health and monitoring
  healthCheckInterval?: number;
  healthStaleThresholdMs?: number;
  configPollingInterval?: number;
  metricsPort?: number;

  // Tracing
  tracingEnabled?: boolean;
  tracingServiceName?: string;
  jaegerEndpoint?: string;

  // External service URLs
  hascoServiceUrl?: string;
  mdgapiBaseUrl?: string;
  mdgapiTimeout?: number;
  mdgapiRetries?: number;
  mdgapiRetryDelay?: number;

  // Docker/deployment specific
  containerName?: string;
  network?: string;

  // Module URLs (IM-specific)
  moduleUrls?: Record<string, string>;
  moduleApiBaseUrls?: Record<string, string>;

  // Database statement configuration
  dbStatementTimeout?: number;
  dbPoolMin?: number;
  dbPoolMax?: number;

  // SSL configuration
  dbSslEnabled?: boolean;
  dbSslRejectUnauthorized?: boolean;

  // Other configuration
  maxExecutionRetries?: number;
  appVersion?: string;
}

/**
 * Result of configuration extraction
 */
export interface ExtractedConfig {
  componentId: string;
  systemId: string;
  systemType: string;
  componentType: string;
  endpoint?: string;
  envVars: Record<string, string>;
  warnings: string[];
}

/**
 * Options for configuration extraction
 */
export interface ExtractOptions {
  configPath: string;
  componentId?: string;  // Optional - will auto-discover
  systemId?: string;     // Optional - will auto-discover
  outputPath?: string;   // Optional - for writing .env file
  validateOnly?: boolean;  // Only validate, don't extract
}
