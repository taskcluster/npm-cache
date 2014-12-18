import npm from '../src/npm';
import assert from 'assert';
import fs from 'mz/fs';

suite('npm', function() {

  var subject;
  setup(async function() {
    subject = await npm();
  });

  teardown(async function() {
    await subject.destroy();
  });

  test('setup / destroy', async function() {
    assert(await fs.exists(subject.dir));
    await subject.destroy();
    assert(!await fs.exists(subject.dir));
  });

  suite('#install', function() {

    test('install one dep', async function() {
      var content = require('./fixtures/simple')
      await subject.install(content);

      assert(await fs.exists(subject.dir + '/node_modules'))
      assert(await fs.exists(subject.dir + '/node_modules/debug'));
    });
  });

  suite('#exportTar', function() {
    test('without install', async function() {
      var err;
      try {
        await subject.exportTar();
      } catch (e) {
        err = e;
      }
      assert(err, 'Must throw an error')
    });
  });

  test('with install', async function() {
    await subject.install(require('./fixtures/simple'));
    let path = await subject.exportTar();
    assert.ok(await fs.exists(path));
  });
});
