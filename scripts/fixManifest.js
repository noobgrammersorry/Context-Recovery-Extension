const fs = require("fs");
const path = require("path");

const manifestPath = path.join(
  __dirname,
  "../build/chrome-mv3-prod/manifest.json"
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Ensure all required permissions are present
const requiredPermissions = ["tabs", "storage", "sidePanel", "alarms"];
if (!manifest.permissions) {
  manifest.permissions = [];
}

requiredPermissions.forEach((perm) => {
  if (!manifest.permissions.includes(perm)) {
    manifest.permissions.push(perm);
  }
});

if (!manifest.optional_permissions) {
  manifest.optional_permissions = [];
}

if (!manifest.optional_permissions.includes("history")) {
  manifest.optional_permissions.push("history");
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
console.log("✓ Manifest permissions updated:", manifest.permissions);
console.log("✓ Optional permissions updated:", manifest.optional_permissions);
