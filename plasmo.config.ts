export default {
  manifest: {
    name: "Context Recovery",
    description: "Recover interrupted browsing tasks from recent activity.",
    permissions: ["tabs", "storage", "sidePanel", "alarms"],
    optional_permissions: ["history"],
    action: {
      default_title: "Context Recovery"
    }
  }
}
