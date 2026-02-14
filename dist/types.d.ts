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
    installerInputs?: any;
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
    port: number;
    host?: string;
    nodeEnv?: string;
    logLevel?: string;
    corsOrigin?: string;
    databaseUsageMode?: 'LOCAL' | 'SHARED' | 'NONE';
    localDatabaseUrl?: string;
    sharedDatabaseDeploymentKey?: string;
    mariadbHost?: string;
    mariadbPort?: number;
    mariadbUser?: string;
    mariadbPassword?: string;
    mariadbDatabase?: string;
    mariadbRootPassword?: string;
    mariadbSslEnabled?: boolean;
    mariadbSslRejectUnauthorized?: boolean;
    mariadbMaxConnections?: number;
    mariadbPoolMin?: number;
    mariadbPoolMax?: number;
    infraIamBaseUrl?: string;
    infraImBaseUrl?: string;
    infraConfigBaseUrl?: string;
    infraSecurityBaseUrl?: string;
    apiBaseUrl?: string;
    jwtSecret?: string;
    jwtAlgorithm?: string;
    jwtPublicKeyPath?: string;
    jwtExpiresIn?: string;
    oidcIssuer?: string;
    oidcClientId?: string;
    oidcRedirectUri?: string;
    oidcAllowedScopes?: string;
    cookieSecure?: boolean;
    refreshTokenEncKey?: string;
    mfaEncKey?: string;
    scimSharedSecret?: string;
    dataShareSecret?: string;
    infraImBearerToken?: string;
    allowDevAdminSeed?: boolean;
    bootstrapOidcClientId?: string;
    bootstrapOidcRedirectUris?: string;
    bootstrapOidcAllowedScopes?: string;
    bootstrapOidcClientSecret?: string;
    mtlsEnabled?: boolean;
    mtlsCertPath?: string;
    mtlsKeyPath?: string;
    mtlsCaPath?: string;
    natsUrl?: string;
    natsClientName?: string;
    natsStreamName?: string;
    natsConsumerName?: string;
    natsSubjectInbound?: string;
    natsClientPort?: number;
    natsHttpPort?: number;
    redisUrl?: string;
    redisMaxRetries?: number;
    redisConnectTimeout?: number;
    redisMaxmemory?: string;
    cacheTtlSeconds?: number;
    cacheTtlMaterials?: number;
    cacheTtlRecipes?: number;
    cacheTtlEquipment?: number;
    cacheTtlBoms?: number;
    cacheTtlSearch?: number;
    cacheTtlValidation?: number;
    cacheKeyPrefix?: string;
    rateLimitWindowMs?: number;
    rateLimitMaxRequests?: number;
    rateLimitApi?: number;
    rateLimitBulk?: number;
    rateLimitExport?: number;
    healthCheckInterval?: number;
    healthStaleThresholdMs?: number;
    configPollingInterval?: number;
    metricsPort?: number;
    tracingEnabled?: boolean;
    tracingServiceName?: string;
    jaegerEndpoint?: string;
    hascoServiceUrl?: string;
    mdgapiBaseUrl?: string;
    mdgapiTimeout?: number;
    mdgapiRetries?: number;
    mdgapiRetryDelay?: number;
    containerName?: string;
    network?: string;
    githubRepo?: string;
    githubBranch?: string;
    githubCommit?: string;
    dbLocalUrl?: string;
    dbNetworkKey?: string;
    repo?: string;
    branch?: string;
    commit?: string;
    moduleUrls?: Record<string, string>;
    moduleApiBaseUrls?: Record<string, string>;
    dbStatementTimeout?: number;
    dbPoolMin?: number;
    dbPoolMax?: number;
    dbSslEnabled?: boolean;
    dbSslRejectUnauthorized?: boolean;
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
    componentId?: string;
    systemId?: string;
    outputPath?: string;
    validateOnly?: boolean;
}
//# sourceMappingURL=types.d.ts.map