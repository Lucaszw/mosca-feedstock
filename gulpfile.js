const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const gulp = require('gulp');
const yaml = require('yamljs');
const title = (...m) => console.log('---------------\n', ...m, '\n---------------');

gulp.task('build', async (d) => {
  title('loading meta.yaml file');
  const file = path.resolve(__dirname, 'meta.yaml');
  const meta = yaml.load(file);

  title('updating meta.yaml file');
  var {output} = await spawnAsync(`npm view mosca --json`, null, true);
  const mosca = JSON.parse(output[0]);
  meta.package.version = mosca.version;
  fs.writeFileSync(file, yaml.stringify(meta, 4));
  console.log(yaml.stringify(meta, 4));

  title('running conda build');
  await spawnAsync('conda build .');

  title('reverting meta.yaml file');
  meta.package.version = 'VERSION'
  fs.writeFileSync(file, yaml.stringify(meta, 4));
  console.log(yaml.stringify(meta, 4));

});

function spawnAsync(cmd, cwd, hideOutput) {
  let options = {shell: true};
  if (cwd) options.cwd = cwd;
  if (!hideOutput) options.stdio = 'inherit';

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, options);
    const output = [];
    if (hideOutput) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (d) => {
        output.push(d);
      });
    }
    child.on('exit', (code) => {
      if (hideOutput)
        resolve({code, output});
      else
        resolve(code);
    });
  });
}
