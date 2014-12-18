import { exec } from 'mz/child_process';

export default async function(cmd, opts={}) {
  // XXX: Replace console log with nicer formatter...
  console.log('npm cache cmd: ', cmd);
  return await exec(cmd, opts);
}
