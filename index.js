var fs = require('fs');
var path = require('path')
var debug = require('debug')('component-json');
var swig = require('swig');
var mkdir = require('mkdirp');

/** 
 * A component that uses swig to compile html
 * templates. This component puts files into /name/index.html
 * folder structure within build.
 */
module.exports = function(builder) {
  builder.hook('before scripts', buildTemplates);
};

/**
 * Iterate over templates and build with partials
 */

function buildTemplates(pkg, next) {
  // Grab our JSON files.
  swig.setDefaults({
    loader: swig.loaders.fs(path.resolve() + '/templates/partials')
  });

  if (!pkg.config.templates) return next();
  var files = pkg.config.templates.filter(filterHtml);


  files.forEach(function(file) {
    debug('compiling: %s', file);
    var fileInfo = getFileName(file);
    var writeLocation = getWriteLocation(fileInfo, path.resolve() + '/build');
    mkdir.sync(writeLocation);
    var string = fs.readFileSync(pkg.path(file), 'utf8');
    var output = swig.render(string, {
      filename: file
    });
    fs.writeFileSync(writeLocation + '/index.html', output);
  });
  next();
}

/**
 * Filter for .html files.
 */

function filterHtml(filename) {
  if (path.extname(filename) === '.html') return true;
}

/**
 * Returns the filename and extension of a path in component
 *
 * @param  {String} filePath tbhe path of the given file in the
 *                            component.json file
 * @return {Object}          {name: 'stuff',extension: '.html'}
 */
function getFileName(filePath) {
  var pathArr = filePath.split('/');
  var name = pathArr[pathArr.length - 1].split('.');
  return {
    name: name[0],
    extension: name[1]
  }
};

/**
 * Returns the location to write the built file
 
 * @param  {Object} filePath  An object with filename and extension
 * @param  {String} buildPath The path of the given file in the
 *                            component.json file
 * @return {String}           The path to write the file in the build folder
 */
function getWriteLocation(fileInfo, buildPath) {
  if (fileInfo.name == 'index') {
    return path.resolve(buildPath);
  } else {
    return path.resolve(buildPath, fileInfo.name);
  }
}