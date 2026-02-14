import { DeploymentConfig } from './types';

export function normalizeDeploymentConfig(deployment: DeploymentConfig): DeploymentConfig {
  const normalized: any = { ...(deployment as any) };

  // DB legacy aliases
  if (normalized.dbLocalUrl !== undefined && normalized.localDatabaseUrl === undefined) {
    normalized.localDatabaseUrl = normalized.dbLocalUrl;
  }
  if (normalized.dbNetworkKey !== undefined && normalized.sharedDatabaseDeploymentKey === undefined) {
    normalized.sharedDatabaseDeploymentKey = normalized.dbNetworkKey;
  }

  // Git legacy aliases
  if (normalized.repo !== undefined && normalized.githubRepo === undefined) {
    normalized.githubRepo = normalized.repo;
  }
  if (normalized.branch !== undefined && normalized.githubBranch === undefined) {
    normalized.githubBranch = normalized.branch;
  }
  if (normalized.commit !== undefined && normalized.githubCommit === undefined) {
    normalized.githubCommit = normalized.commit;
  }

  return normalized as DeploymentConfig;
}
