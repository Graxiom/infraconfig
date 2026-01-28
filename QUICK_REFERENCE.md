# Quick Reference - @pharma/infraconfig

## 🚀 Quick Start

### Extract Configuration
```bash
# From project root
npm run extract-config infraconfig/infra-config.json > .env.deployment

# Or directly
node infraconfig/dist/bin/extract-config.js infraconfig/infra-config.json infra-iam-a > .env
```

### Validate Configuration
```bash
npm run validate-config infraconfig/infra-config.json
```

### Pre-Deployment Check
```bash
npm run pre-deploy-check
```

### Deploy
```bash
./deploy-new.sh infraconfig/infra-config.json
```

---

## 📝 Standard Field Names (Use These!)

### ✅ Correct (Use These)
```json
{
  "mariadbHost": "...",
  "mariadbPort": 3306,
  "mariadbUser": "...",
  "mariadbPassword": "...",
  "mariadbDatabase": "...",          // ← Full word "Database"
  "mariadbRootPassword": "...",
  "corsOrigin": "*",                  // ← Singular
  "infraIamBaseUrl": "http://...",   // ← Pattern: {service}BaseUrl
  "infraImBaseUrl": "http://...",
  "infraConfigBaseUrl": "http://...",
  "apiBaseUrl": "http://..."          // ← For WEB → AGENT
}
```

### ❌ Deprecated (Don't Use)
```json
{
  "postgresHost": "...",      // ❌ Use mariadbHost
  "postgresPort": 5432,        // ❌ Use mariadbPort
  "mysqlHost": "...",          // ❌ Use mariadbHost
  "mysqlDatabase": "...",      // ❌ Use mariadbDatabase
  "mariadbDb": "...",          // ❌ Use mariadbDatabase (full word)
  "corsOrigins": "*",          // ❌ Use corsOrigin (singular)
  "iamApiUrl": "http://...",   // ❌ Use infraIamBaseUrl
  "apiUrl": "http://..."       // ❌ Use apiBaseUrl
}
```

---

## 🔧 Environment Variables Generated

### Core Metadata (Always Exported)
```bash
COMPONENT_ID=infra-iam-a
COMPONENT_TYPE=AGENT
SYSTEM_ID=infra-iam
SYSTEM_TYPE=IAM
INFRA_CONFIG_VERSION=1
INFRA_ENVIRONMENT=qual
```

### Database (MariaDB Standard)
```bash
MARIADB_HOST=host.docker.internal
MARIADB_PORT=3307
MARIADB_USER=infra_iam_user
MARIADB_PASSWORD=***
MARIADB_DATABASE=infra_iam
MARIADB_ROOT_PASSWORD=***
MARIADB_SSL_ENABLED=false
MARIADB_MAX_CONNECTIONS=20
```

### Application
```bash
PORT=4001
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=*
```

### Service URLs
```bash
INFRA_IAM_BASE_URL=http://localhost:4001
INFRA_IM_BASE_URL=http://localhost:4002
INFRA_CONFIG_BASE_URL=http://localhost:4003
API_BASE_URL=http://localhost:4001
```

---

## 📋 Component Types

### AGENT Components
**Requirements:**
- `port` (required)
- MariaDB fields (if using database)
- Service-specific fields (JWT, OIDC, etc.)

**Example:**
```json
{
  "componentType": "AGENT",
  "deployment": {
    "port": 4001,
    "mariadbHost": "mariadb",
    "mariadbDatabase": "db_name",
    "jwtSecret": "...",
    "logLevel": "info"
  }
}
```

### WEB Components  
**Requirements:**
- `port` (required)
- `apiBaseUrl` (recommended - points to AGENT)

**Example:**
```json
{
  "componentType": "WEB",
  "deployment": {
    "port": 8081,
    "apiBaseUrl": "http://localhost:4001",
    "corsOrigin": "*"
  }
}
```

---

## 🎯 Auto-Discovery Priority

The extractor searches in this order:

1. **Explicit ID:** `COMPONENT_ID` env var or CLI arg
2. **Cross-system search:** Find componentId in any system
3. **First enabled AGENT:** Auto-discover
4. **First component:** Fallback

**Examples:**
```bash
# Explicit
extract-config config.json infra-iam-a

# Environment variable
COMPONENT_ID=infra-iam-a extract-config config.json

# Auto-discover (finds first enabled AGENT)
extract-config config.json
```

---

## 🔍 Validation Checks

### File Level
- ✅ JSON syntax valid
- ✅ schemaVersion present
- ✅ systems array exists

### System Level
- ✅ systemId present
- ✅ components array exists

### Component Level
- ✅ componentId present
- ✅ deployment object exists
- ✅ Required fields for component type
- ⚠️ Warns on deprecated fields

### Field Level
- ⚠️ `postgres*` fields → Use `mariadb*`
- ⚠️ `mysql*` fields → Use `mariadb*`
- ⚠️ `mariadbDb` → Use `mariadbDatabase`
- ⚠️ `corsOrigins` → Use `corsOrigin`
- ⚠️ `iamApiUrl` → Use `infraIamBaseUrl`

---

## 🛠️ Common Tasks

### Test Extraction
```bash
node infraconfig/dist/bin/extract-config.js infraconfig/infra-config.json infra-iam-a | head -20
```

### Check for Deprecations
```bash
node infraconfig/dist/bin/validate-config.js infraconfig/infra-config.json
```

### Generate .env for Docker
```bash
node infraconfig/dist/bin/extract-config.js infraconfig/infra-config.json infra-iam-a > .env.deployment
docker-compose --env-file .env.deployment up -d
```

### Debug Configuration
```bash
# Show all generated variables
node infraconfig/dist/bin/extract-config.js infraconfig/infra-config.json infra-iam-a | grep -v "^#"

# Check specific variable
node infraconfig/dist/bin/extract-config.js infraconfig/infra-config.json infra-iam-a | grep MARIADB_
```

---

## 📚 File Locations

```
infraconfig/
├── infra-config.json              # Official config
├── dist/bin/extract-config.js     # Extractor
├── dist/bin/validate-config.js    # Validator
└── scripts/pre-deploy-check.sh    # Pre-deployment validation
```

---

## 💡 Tips

1. **Always validate before deploying:**
   ```bash
   npm run validate-config infraconfig/infra-config.json
   ```

2. **Use environment variables for flexibility:**
   ```bash
   COMPONENT_ID=infra-iam-a npm run extract-config infraconfig/infra-config.json
   ```

3. **Check generated variables:**
   ```bash
   cat .env.deployment | grep MARIADB
   ```

4. **Test configuration changes:**
   ```bash
   npm run validate-config infraconfig/infra-config.json && \
   npm run extract-config infraconfig/infra-config.json > test.env
   ```

---

## 🆘 Troubleshooting

### "Component not found"
→ Check `componentId` matches in infra-config.json  
→ Use `COMPONENT_ID` env var or CLI arg

### "Missing required parameter"
→ Check deployment object has all required fields  
→ AGENT needs `port` + database fields  
→ WEB needs `port` + `apiBaseUrl`

### "Deprecated field" warning
→ Rename field per standard naming convention  
→ See "Deprecated" section above

### "Invalid JSON"
→ Run: `jq empty infraconfig/infra-config.json`  
→ Fix syntax errors

---

## 📦 Distribution

To use in another project:

```bash
# Copy library
cp -r infraconfig /path/to/other-project/

# Install dependencies
cd /path/to/other-project/infraconfig && npm install && npm run build

# Update project's infra-config.json to standard format

# Add scripts to project's package.json
```

---

**Need help? See:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
