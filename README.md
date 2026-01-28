# @pharma/infraconfig

Standardized infrastructure configuration management library for all Pharma infrastructure and ERP services.

## Features

✅ **MariaDB Standardization** - All database configs use MariaDB (no PostgreSQL/MySQL mixing)  
✅ **Consistent Field Naming** - Standardized naming conventions across all services  
✅ **Auto-Discovery** - No hardcoded system/component IDs - auto-detects from config  
✅ **Zero Hardcoding** - All configuration comes from infra-config.json  
✅ **Type-Safe** - Full TypeScript types for config schema  
✅ **Validation** - Comprehensive validation with clear error messages  

## Installation

```bash
npm install @pharma/infraconfig
```

## Usage

### Extract Configuration

```typescript
import { extractConfig } from '@pharma/infraconfig';

const result = extractConfig({
  configPath: './infra-config.json',
  componentId: 'infra-iam-a'  // Optional - auto-discovers if not provided
});

console.log(result.envVars);  // Environment variables ready for .env file
```

### Command Line

```bash
# Extract config for a specific component
extract-config ./infra-config.json infra-iam-a > .env.deployment

# Auto-discover component from environment
COMPONENT_ID=infra-iam-a extract-config ./infra-config.json > .env.deployment

# Validate config structure
validate-config ./infra-config.json
```

## Configuration Schema

All services must follow this standardized schema:

```json
{
  "schemaVersion": "1.0",
  "environment": "qual",
  "systems": [
    {
      "systemId": "infra-iam",
      "systemType": "IAM",
      "components": [
        {
          "componentId": "infra-iam-a",
          "componentType": "AGENT",
          "endpoint": "http://localhost:4001",
          "enabled": true,
          "deployment": {
            "port": 4001,
            "host": "0.0.0.0",
            "mariadbHost": "mariadb",
            "mariadbPort": 3307,
            "mariadbUser": "infra_iam_user",
            "mariadbPassword": "...",
            "mariadbDatabase": "infra_iam",
            "mariadbRootPassword": "...",
            "corsOrigin": "*",
            "nodeEnv": "production",
            "logLevel": "info"
          }
        }
      ]
    }
  ]
}
```

## Standard Fields

### Core Fields (All Components)
- `port` - Service port number
- `host` - Bind host (default: 0.0.0.0)
- `nodeEnv` - Environment (development/production)
- `logLevel` - Log level (debug/info/warn/error)
- `corsOrigin` - CORS origin (singular, not plural)

### MariaDB Fields (Components with Database)
- `mariadbHost` - Database host
- `mariadbPort` - Database port
- `mariadbUser` - Database user
- `mariadbPassword` - Database password
- `mariadbDatabase` - Database name (not "Db")
- `mariadbRootPassword` - Root password
- `mariadbSslEnabled` - SSL enabled (optional)
- `mariadbMaxConnections` - Max connections (optional)

### Service URLs (As Needed)
- `infraIamBaseUrl` - IAM service URL
- `infraImBaseUrl` - IM service URL
- `infraConfigBaseUrl` - Config service URL
- Pattern: `{service}BaseUrl`

## Migration from Old Configs

### PostgreSQL → MariaDB
```diff
- "postgresHost": "postgres"
- "postgresPort": 5432
- "postgresUser": "user"
- "postgresPassword": "pass"
- "postgresDb": "database"
+ "mariadbHost": "mariadb"
+ "mariadbPort": 3306
+ "mariadbUser": "user"
+ "mariadbPassword": "pass"
+ "mariadbDatabase": "database"
```

### MySQL → MariaDB
```diff
- "mysqlHost": "mysql"
- "mysqlDatabase": "db"
+ "mariadbHost": "mariadb"
+ "mariadbDatabase": "db"
```

### CORS Naming
```diff
- "corsOrigins": "*"
+ "corsOrigin": "*"
```

### Database Field Name
```diff
- "mariadbDb": "database"
+ "mariadbDatabase": "database"
```

## License

PROPRIETARY - Internal use only
