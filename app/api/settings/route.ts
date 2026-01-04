import { authenticateToken } from "@/lib/auth/token-auth";
import {
  isPremiumUser,
  getUserSettings,
  getOrCreateUserSettings,
  updateUserSettings,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * GET /api/settings - Get user settings
 */
export async function GET(request: Request) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const isPremium = await isPremiumUser(user.id);
    const settings = await getUserSettings(user.id);

    // Return default settings if none exist
    const defaultSettings = {
      globalMemoryEnabled: true,
      autoVanishEnabled: false,
      autoVanishDays: 30,
      hardBurnEnabled: false,
    };

    return Response.json({
      isPremium,
      settings: settings
        ? {
            globalMemoryEnabled: settings.globalMemoryEnabled,
            autoVanishEnabled: settings.autoVanishEnabled,
            autoVanishDays: settings.autoVanishDays,
            hardBurnEnabled: settings.hardBurnEnabled,
          }
        : defaultSettings,
      // Indicate which features are locked
      lockedFeatures: isPremium ? [] : ["globalMemory", "autoVanish"],
    });
  } catch (error) {
    console.error("Settings get error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError(
      "bad_request:api",
      "Failed to get settings"
    ).toResponse();
  }
}

/**
 * PUT /api/settings - Update user settings (Premium only)
 */
export async function PUT(request: Request) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check if user has premium access
    const isPremium = await isPremiumUser(user.id);
    if (!isPremium) {
      return new ChatSDKError(
        "forbidden:api",
        "Premium settings require a Premium subscription"
      ).toResponse();
    }

    const body = await request.json();
    const {
      globalMemoryEnabled,
      autoVanishEnabled,
      autoVanishDays,
      hardBurnEnabled,
    } = body;

    // Validate settings
    const updates: {
      globalMemoryEnabled?: boolean;
      autoVanishEnabled?: boolean;
      autoVanishDays?: number;
      hardBurnEnabled?: boolean;
    } = {};

    if (typeof globalMemoryEnabled === "boolean") {
      updates.globalMemoryEnabled = globalMemoryEnabled;
    }

    if (typeof autoVanishEnabled === "boolean") {
      updates.autoVanishEnabled = autoVanishEnabled;
    }

    if (typeof autoVanishDays === "number") {
      // Validate days range (7-365)
      if (autoVanishDays < 7 || autoVanishDays > 365) {
        return new ChatSDKError(
          "bad_request:api",
          "Auto-vanish days must be between 7 and 365"
        ).toResponse();
      }
      updates.autoVanishDays = autoVanishDays;
    }

    if (typeof hardBurnEnabled === "boolean") {
      updates.hardBurnEnabled = hardBurnEnabled;
    }

    // Update settings
    const updatedSettings = await updateUserSettings(user.id, updates);

    return Response.json({
      success: true,
      settings: {
        globalMemoryEnabled: updatedSettings.globalMemoryEnabled,
        autoVanishEnabled: updatedSettings.autoVanishEnabled,
        autoVanishDays: updatedSettings.autoVanishDays,
        hardBurnEnabled: updatedSettings.hardBurnEnabled,
      },
    });
  } catch (error) {
    console.error("Settings update error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError(
      "bad_request:api",
      "Failed to update settings"
    ).toResponse();
  }
}
