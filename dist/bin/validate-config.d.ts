#!/usr/bin/env node
/**
 * Configuration Validator
 *
 * Validates infra-config.json structure and reports issues
 */
interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    path: string;
    message: string;
}
export declare function validate(configPath: string): {
    valid: boolean;
    issues: ValidationIssue[];
};
export {};
//# sourceMappingURL=validate-config.d.ts.map