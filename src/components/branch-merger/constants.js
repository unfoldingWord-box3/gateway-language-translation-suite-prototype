export const defaultStatus = {
  mergeNeeded: false,
  conflict: false,
  success: false,
  userBranchDeleted: false,
  error: false,
  message: "",
  pullRequest: "",
}

export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // ms
export const RATE_LIMIT_DELAY = 1000; // 1 second between API calls
export const DEFAULT_AUTO_CHECK_INTERVAL = 30000; // 30 seconds 