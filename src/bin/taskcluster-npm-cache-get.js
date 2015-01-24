#! /usr/bin/env node

// This module is the entrypoint so it needs to import the polyfill...
import '6to5/polyfill';

import { ArgumentParser } from 'argparse';
import taskcluster from 'taskcluster-client';
import fs from 'fs';
import fsPath from 'path';
import eventToPromise from 'event-to-promise';
import hash from '../hash';
import signature from '../signature';
import npm from '../npm';
import temp from 'promised-temp';
import run from '../run';

let parser = new ArgumentParser();
parser.addArgument(['--namespace'], {
  defaultValue: 'npm_cache',
  help: 'Index namespace to use'
});

parser.addArgument(['--target'], {
  defaultValue: process.cwd(),
  help: 'Location where to create node_modules'
});

parser.addArgument(['package'], {
  help: 'path to package.json',
  type: function(path) {
    path = fsPath.resolve(path);
    if (!fs.existsSync(path)) {
      throw new Error(`"${path}" cannot be found`)
    }
    return path;
  }
});

async function expandCacheNodeModules(url, modules) {
  let dir = await temp.mkdir('npm-cache');
}

async function main() {
  let args = parser.parseArgs(process.argv.slice(2));
  let index = new taskcluster.Index();
  let queue = new taskcluster.Queue();

  let pkgText = fs.readFileSync(args.package, 'utf8')
  let pkgHash = hash(pkgText);
  let namespace = `${args.namespace}.${signature()}.${pkgHash}`

  // Check to see if we already have this package json cached...
  let indexedTask;
  try {
    indexedTask = await index.findTask(namespace);
  } catch (e) {
    if (!err.statusCode || err.statusCode !== 404) throw e;
  }

  if (!indexedTask) {
    console.log('[tc-npm-cache] cache miss');
    await run('npm', ['install']);
    return;
  }

  let url = await queue.buildUrl(
    queue.getLatestArtifact,
    indexedTask.taskId,
    'public/node_modules.tar.gz'
  );

  let workspace = await npm();
  await workspace.extract(url, args.target);
}

main().catch((e) => {
  process.nextTick(() => {
    console.error('Something is wrong...');
    throw e;
  })
});

