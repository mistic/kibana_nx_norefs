const { createProjectGraphAsync } = require('@nrwl/workspace/src/core/project-graph');
const { workspaceRoot } = require('nx/src/utils/workspace-root');
const fs = require('fs');


(async () => {
  const projGraph = await createProjectGraphAsync()
  const nodeNames = Object.keys(projGraph.nodes);
  const paths = {};
  nodeNames.forEach((name) => {
    if(!projGraph.nodes[name].data.targets.typecheck) {
      return;
    }

    const pkgName = `@kbn/${projGraph.nodes[name].name.replace(/^kbn-/gi, '').replace(/-/gi, '/')}`;
    paths[`${pkgName}/*`] = [`${projGraph.nodes[name].data.root}/src/*`];
  });

  // paths
  const baseTS = JSON.parse(fs.readFileSync(`${workspaceRoot}/tsconfig.base.json`, 'utf8'));
  baseTS.compilerOptions.paths = paths;

  fs.writeFileSync(`${workspaceRoot}/tsconfig.base.json`, JSON.stringify(baseTS, null, 2));

  process.exit(0);
})();
