#! /usr/bin/env node

// This module is the entrypoint so it needs to import the polyfill...
import '6to5/polyfill';

import { ArgumentParser } from 'argparse';
import assert from 'assert';
import npm from '../npm';
import taskcluster from 'taskcluster-client';
import request from 'superagent-promise';
import fs from 'mz/fs';
import fsPath from 'path';
import eventToPromise from 'event-to-promise';

let parser = new ArgumentParser();
parser.addArgument(['--task-id'], {
  help: 'The task to run caching logic for',
  required: true,
  dest: 'taskId'
});

parser.addArgument(['--run-id'], {
  help: 'Run id for the particular task',
  dest: 'runId',
  defaultValue: 0
});


parser.addArgument(['--proxy'], {
  action: 'storeTrue',
  help: 'Rely on the taskcluster proxy service provided by the docker-worker'
});

async function upload(queue, taskId, runId, modulePath) {
  let size = (await fs.stat(modulePath)).size;
  let tar = fs.createReadStream(modulePath);

  let expires = new Date();
  expires.setHours(expires.getHours() + 1);

  let artifact = {
    storageType: 's3',
    expires: expires,
    contentType: 'application/x-tar'
  };

  let artifactUrl = await queue.createArtifact(
    taskId, runId, 'public/node_modules.tar.gz', artifact
  );

  let put = request.put(artifactUrl.putUrl);
  put.set('Content-Length', size);
  put.set('Content-Type', 'application/x-tar');
  put.set('Content-Encoding', 'gzip');
  tar.pipe(put);
  put.end()
  let res = await eventToPromise(put, 'response');
  await eventToPromise(put, 'end');
}

async function main() {
  let args = parser.parseArgs(process.argv.slice(2));

  let queueOpts = {};
  let indexOpts = {};

  if (args.proxy) {
    queueOpts.baseUrl = 'taskcluster/queue';
    indexOpts.baseUrl = 'taskcluster/index';
  }

  let queue = new taskcluster.Queue();
  let index = new taskcluster.Index();

  let task = await queue.getTask(args.taskId);

  if (!task.extra || !task.extra.npmCache) {
    console.error('Task must contain task.extra');
    process.exit(1);
  }

  let url = task.extra.npmCache.url;
  if (!url) {
    console.error('Task must contain a url');
  }

  let pkgReqs = await request.get(url).end();
  let pkg = JSON.parse(pkgReqs.text);

  // TODO: Bail if we have a hash here...
  let workspace = await npm();
  await workspace.install(pkg);
  let moduleTar = await workspace.exportTar()
  await upload(queue, args.taskId, args.runId, moduleTar);
}

main().catch((e) => {
  process.nextTick(() => { throw e })
});
