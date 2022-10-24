const { createProjectGraphAsync } = require('@nrwl/workspace/src/core/project-graph');
const { workspaceRoot } = require('nx/src/utils/workspace-root');
const { FsTree, flushChanges } = require('nx/src/generators/tree');
const { printChanges } = require('nx/src/command-line/generate');
const { names, updateJson, formatFiles} = require('@nrwl/devkit');

(async () => {
  const projGraph = await createProjectGraphAsync()
  const nodeNames = Object.keys(projGraph.nodes);
  const paths = {};
  const dryRun = process.argv[2] ? names(process.argv[2].replace(/--/, '')).propertyName : null;
  nodeNames.forEach((name) => {
    if(!projGraph.nodes[name].data.targets.typecheck) {
      return;
    }

    const pkgName = `@kbn/${projGraph.nodes[name].name.replace(/^kbn-/gi, '').replace(/-/gi, '/')}`;
    paths[`${pkgName}/*`] = [`${projGraph.nodes[name].data.root}/src/*`];
    paths[`${pkgName}`] = [`${projGraph.nodes[name].data.root}/src/index.ts`];
  });

  // update paths
  const host = new FsTree(workspaceRoot, false);

  if (host.exists('tsconfig.base.json')) {
    updateJson(host, 'tsconfig.base.json', (tsconfig) => {
      if (tsconfig.compilerOptions.paths) {
        tsconfig.compilerOptions.paths = paths;
      }
      return tsconfig
    })
  }

  await formatFiles(host);

  const changes = host.listChanges()
  printChanges(changes);

  if (dryRun === 'dryRun') {
    console.warn(`\nNOTE: The "dryRun" flag means no changes were made.`);
  } else {
    flushChanges(workspaceRoot, changes);
  }

  process.exit(0);
})();
