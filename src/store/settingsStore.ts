import { create } from "zustand"

import type { UserSettings } from "~src/lib/models"

const defaultSettings: UserSettings = {
  trackingEnabled: true,
  excludedDomains: [],
  idleTimeoutMinutes: 5,
  privacyMode: false
}

interface SettingsState {
  settings: UserSettings
  setSettings: (settings: UserSettings) => void
  updatePartial: (partial: Partial<UserSettings>) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  updatePartial: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...partial
      }
    }))
}))
