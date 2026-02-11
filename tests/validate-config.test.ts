import { validate } from '../src/bin/validate-config';
import * as path from 'path';

describe('Configuration Validation', () => {
  const mocksDir = path.join(__dirname, 'mocks');

  it('should pass for valid LOCAL configuration', () => {
    const result = validate(path.join(mocksDir, 'valid-local.json'));
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(result.valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should pass for valid SHARED configuration', () => {
    const result = validate(path.join(mocksDir, 'valid-shared.json'));
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(result.valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should fail for LOCAL configuration missing keys', () => {
    const result = validate(path.join(mocksDir, 'invalid-local-missing-key.json'));
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(result.valid).toBe(false);
    expect(errors.some(e => e.message.includes('dbNetworkKey is required'))).toBe(true);
  });

  it('should fail for SHARED configuration with local URL', () => {
    const result = validate(path.join(mocksDir, 'invalid-shared-with-url.json'));
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(result.valid).toBe(false);
    expect(errors.some(e => e.message.includes('dbLocalUrl must not be defined'))).toBe(true);
  });
});
