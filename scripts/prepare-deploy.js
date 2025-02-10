const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT_DIR, 'apps/dashboard');
const DEPLOY_DIR = path.join(ROOT_DIR, 'deploy');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Clean and create deploy directory
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true });
}
fs.mkdirSync(DEPLOY_DIR);

// Function to resolve workspace dependencies in a package.json
function resolveWorkspaceDeps(pkgJson, relativePath = '') {
  const deps = { ...pkgJson.dependencies };
  
  for (const [name, version] of Object.entries(deps)) {
    if (version === 'workspace:*' && name.startsWith('@midday/')) {
      const packageName = name.replace('@midday/', '');
      const pkgDir = path.join(PACKAGES_DIR, packageName);
      const pkgJsonPath = path.join(pkgDir, 'package.json');
      
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = require(pkgJsonPath);
        // Use the actual version from the package
        deps[name] = pkg.version || '1.0.0';
        
        // Copy package to node_modules
        const targetDir = path.join(DEPLOY_DIR, 'node_modules', '@midday', packageName);
        fs.mkdirSync(targetDir, { recursive: true });
        execSync(`cp -r ${pkgDir}/* ${targetDir}/`);
        
        // Resolve nested workspace dependencies
        if (pkg.dependencies) {
          const resolvedNestedDeps = resolveWorkspaceDeps(pkg, `@midday/${packageName}`);
          // Update the copied package.json with resolved dependencies
          const targetPkgJson = { ...pkg, dependencies: resolvedNestedDeps };
          fs.writeFileSync(
            path.join(targetDir, 'package.json'),
            JSON.stringify(targetPkgJson, null, 2)
          );
        }
      }
    }
  }
  
  return deps;
}

// Copy dashboard files
execSync(`cp -r ${DASHBOARD_DIR}/* ${DEPLOY_DIR}/`);

// Create node_modules directory
const nodeModulesDir = path.join(DEPLOY_DIR, 'node_modules');
fs.mkdirSync(nodeModulesDir, { recursive: true });

// Read and update dashboard package.json
const pkgPath = path.join(DEPLOY_DIR, 'package.json');
const pkg = require(pkgPath);

// Create production package.json
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  engines: pkg.engines,
  scripts: {
    start: pkg.scripts.start,
    build: pkg.scripts.build
  },
  dependencies: resolveWorkspaceDeps(pkg)
};

// Write production package.json
fs.writeFileSync(pkgPath, JSON.stringify(prodPkg, null, 2));

// Create .npmrc file
const npmrcPath = path.join(DEPLOY_DIR, '.npmrc');
fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\nstrict-peer-deps=false\n');

console.log('Deploy directory prepared at:', DEPLOY_DIR);
