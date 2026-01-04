import type { UserType } from "@/app/(auth)/auth";
import type { PlanType } from "@/lib/db/queries";

type Entitlements = {
  maxMessagesPerDay: number;
  maxChats: number;
  globalMemory: boolean;
  fileUploads: boolean;
  maxFileSize: number; // bytes, 0 = disabled
  autoVanish: boolean;
};

// Legacy: Entitlements by user type (for backward compatibility)
export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    maxChats: 5,
    globalMemory: false,
    fileUploads: false,
    maxFileSize: 0,
    autoVanish: false,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 50,
    maxChats: 10,
    globalMemory: false,
    fileUploads: false,
    maxFileSize: 0,
    autoVanish: false,
  },
};

// New: Plan-based entitlements (subscription tiers)
export const entitlementsByPlan: Record<PlanType, Entitlements> = {
  /*
   * Free tier - Basic access with rate limits
   */
  free: {
    maxMessagesPerDay: 30,
    maxChats: 10,
    globalMemory: false,
    fileUploads: false,
    maxFileSize: 0,
    autoVanish: false,
  },

  /*
   * Trial tier - Full premium features for 7 days
   */
  trial: {
    maxMessagesPerDay: 100,
    maxChats: 50,
    globalMemory: true,
    fileUploads: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    autoVanish: true,
  },

  /*
   * Premium tier - Unlimited access with all features
   */
  premium: {
    maxMessagesPerDay: -1, // Unlimited
    maxChats: -1, // Unlimited
    globalMemory: true,
    fileUploads: true,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    autoVanish: true,
  },
};

/**
 * Get entitlements for a plan
 */
export function getEntitlements(plan: PlanType): Entitlements {
  return entitlementsByPlan[plan] || entitlementsByPlan.free;
}

/**
 * Check if user can send a message based on their plan
 * @returns true if allowed, false if rate limited
 */
export function canSendMessage(plan: PlanType, currentCount: number): boolean {
  const entitlements = getEntitlements(plan);
  if (entitlements.maxMessagesPerDay === -1) return true;
  return currentCount < entitlements.maxMessagesPerDay;
}

/**
 * Check if user can create a new chat based on their plan
 * @returns true if allowed, false if at limit
 */
export function canCreateChat(plan: PlanType, currentCount: number): boolean {
  const entitlements = getEntitlements(plan);
  if (entitlements.maxChats === -1) return true;
  return currentCount < entitlements.maxChats;
}

/**
 * Check if user can upload a file based on their plan and file size
 * @returns true if allowed, false if not permitted or file too large
 */
export function canUploadFile(
  plan: PlanType,
  fileSize: number
): { allowed: boolean; reason?: string } {
  const entitlements = getEntitlements(plan);

  if (!entitlements.fileUploads) {
    return { allowed: false, reason: "File uploads require Premium" };
  }

  if (fileSize > entitlements.maxFileSize) {
    const maxMB = Math.round(entitlements.maxFileSize / (1024 * 1024));
    return {
      allowed: false,
      reason: `File exceeds ${maxMB}MB limit for your plan`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user has access to global memory
 */
export function hasGlobalMemory(plan: PlanType): boolean {
  return getEntitlements(plan).globalMemory;
}

/**
 * Check if user has access to auto-vanish feature
 */
export function hasAutoVanish(plan: PlanType): boolean {
  return getEntitlements(plan).autoVanish;
}
