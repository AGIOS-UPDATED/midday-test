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

// Copy dashboard files
execSync(`cp -r ${DASHBOARD_DIR}/* ${DEPLOY_DIR}/`);

// Create node_modules directory
const nodeModulesDir = path.join(DEPLOY_DIR, 'node_modules');
fs.mkdirSync(nodeModulesDir, { recursive: true });

// Read dashboard package.json
const pkgPath = path.join(DEPLOY_DIR, 'package.json');
const pkg = require(pkgPath);

// Copy and prepare workspace packages
if (pkg.dependencies) {
  Object.entries(pkg.dependencies).forEach(([name, version]) => {
    if (version === 'workspace:*' && name.startsWith('@midday/')) {
      const packageName = name.replace('@midday/', '');
      const sourcePkgDir = path.join(PACKAGES_DIR, packageName);
      const targetPkgDir = path.join(nodeModulesDir, '@midday', packageName);
      
      // Create package directory
      fs.mkdirSync(path.join(nodeModulesDir, '@midday'), { recursive: true });
      
      // Copy package files
      execSync(`cp -r ${sourcePkgDir} ${path.join(nodeModulesDir, '@midday')}/`);
      
      // Read package's package.json
      const pkgJsonPath = path.join(sourcePkgDir, 'package.json');
      const pkgJson = require(pkgJsonPath);
      
      // Update dependency version to use file path
      pkg.dependencies[name] = `file:node_modules/${name}`;
      
      // Also handle nested workspace dependencies
      if (pkgJson.dependencies) {
        const nestedPkgPath = path.join(targetPkgDir, 'package.json');
        Object.entries(pkgJson.dependencies).forEach(([nestedName, nestedVersion]) => {
          if (nestedVersion === 'workspace:*' && nestedName.startsWith('@midday/')) {
            pkgJson.dependencies[nestedName] = `file:../../${nestedName.replace('@midday/', '')}`;
          }
        });
        fs.writeFileSync(nestedPkgPath, JSON.stringify(pkgJson, null, 2));
      }
    }
  });
}

// Write updated package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// Create .npmrc file
const npmrcPath = path.join(DEPLOY_DIR, '.npmrc');
fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n');

console.log('Deploy directory prepared at:', DEPLOY_DIR);
