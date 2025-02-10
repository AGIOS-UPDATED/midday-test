const fs = require('fs');
const path = require('path');

// Read the root package.json
const rootPkg = require('../package.json');

// Read the dashboard package.json
const dashboardPkgPath = path.join(__dirname, '../apps/dashboard/package.json');
const dashboardPkg = require(dashboardPkgPath);

// Function to resolve workspace dependencies
function resolveWorkspaceDeps(pkg) {
  const deps = pkg.dependencies || {};
  const resolved = { ...deps };

  Object.entries(deps).forEach(([name, version]) => {
    if (version === 'workspace:*') {
      // Find the actual package in workspaces
      const workspacePkgPath = path.join(__dirname, '../packages', name.replace('@midday/', ''), 'package.json');
      if (fs.existsSync(workspacePkgPath)) {
        const workspacePkg = require(workspacePkgPath);
        resolved[name] = workspacePkg.version;
      }
    }
  });

  return resolved;
}

// Resolve workspace dependencies
const resolvedDeps = resolveWorkspaceDeps(dashboardPkg);

// Update the dashboard package.json with resolved versions
dashboardPkg.dependencies = resolvedDeps;

// Write the updated package.json
fs.writeFileSync(dashboardPkgPath, JSON.stringify(dashboardPkg, null, 2));
