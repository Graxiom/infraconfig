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
import { ExtractedConfig, ExtractOptions } from '../types';
/**
 * Main extraction function
 */
export declare function extractConfig(options: ExtractOptions): ExtractedConfig;
//# sourceMappingURL=extract-config.d.ts.map