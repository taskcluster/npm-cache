import temp from 'promised-temp';
import del from 'delete';
import denodeify from 'denodeify';
import Debug from 'debug';
import exec from './exec';
import { format } from 'util';
import fs from 'mz/fs';
import fsPath from 'path';

let debug = Debug('npm-cache:workspace');

class Workspace {
  constructor(dir) {
    this.dir = dir;
  }

  async destroy() {
    await denodeify(del)(this.dir, { force: true });
  }

  /**
  Update or install a npm package json into the current directory.
  */
  async install(pkg) {
    let pkgPath = fsPath.join(this.dir, 'package.json');

    if (await fs.exists(pkgPath)) {
      throw new Error('Cannot run install twice (package.json exists)');
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg));

    // XXX: We may want to sanitize parts of this such as scripts which
    //      effectively lets you run untrusted code.
    await exec('npm install', {
      cwd: this.dir,
      // XXX: Figure out better logging method...
      stdio: 'inherit'
    });
  }

  /**
  Create a new tar containing node_modules and return path.
  */
  async exportTar() {
    let modulesPath = fsPath.join(this.dir, 'node_modules');
    if (!await fs.exists(modulesPath)) {
      throw new Error('No modules to export (node_modules missing)');
    }

    let exportPath = fsPath.join(this.dir, 'node_modules.tar.gz')
    let cmd = format('tar czf %s %s', exportPath, modulesPath);

    await exec(cmd, { stdio: 'inherit' });

    return exportPath;
  }
}

/**
Initialize the workspace with a temp directory.
*/
export default async function init() {
  let dir = await temp.mkdir('npm-cache');
  debug('create: %s', dir);
  return new Workspace(dir);
}