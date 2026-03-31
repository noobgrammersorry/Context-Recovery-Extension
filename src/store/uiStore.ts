import { create } from "zustand"

interface UiState {
  selectedTaskId?: string
  filter: "all" | "open" | "snoozed" | "done"
  loading: boolean
  setFilter: (filter: UiState["filter"]) => void
  setSelectedTaskId: (taskId?: string) => void
  setLoading: (loading: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedTaskId: undefined,
  filter: "open",
  loading: false,
  setFilter: (filter) => set({ filter }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setLoading: (loading) => set({ loading })
}))
