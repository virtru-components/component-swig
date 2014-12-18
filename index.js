var _ = require('underscore')
var fs = require('fs');
var path = require('path')
var debug = require('debug')('component-json');
var swig = require('swig');
var mkdir = require('mkdirp');
var utils = require('component-consoler');
var log = utils.log;

/**
 * A component that uses swig to compile html
 * templates. This component puts files into /name/index.html
 * folder structure within build.
 */
module.exports = function(builder) {
  console.log('Compiling HTML Templates');
  builder.hook('before scripts', buildTemplates);
};


var DEFAULT_CONFIG = {
  partials: 'templates/partials',
  dest: 'build'
};

/**
 * Iterate over templates and build with partials
 */
function buildTemplates(pkg, next) {

  debug('building templates');

  var config = _.extend({}, DEFAULT_CONFIG, pkg.config.swigConfig);
  var swigLocals = config.swigLocals ? loadJson(config.swigLocals) : {};

  // Grab our JSON files.
  swig.setDefaults({
    loader: swig.loaders.fs(path.resolve(config.partials))
  });

  if (!config.templates) {
    debug('No templates to compile.');
    return next();
  }

  var files = config.templates.filter(filterHtml);
  files.forEach(function(file) {
    debug('compiling: %s', file);

    var fileInfo = getFileName(file);

    var dest = path.resolve(config.dest);

    var writeLocation = getWriteLocation(fileInfo, dest);
    mkdir.sync(writeLocation);

    var resolved = pkg.path(file);
    var string = fs.readFileSync(pkg.path(file), 'utf8');
    debug(string);
    var output = swig.render(string, {
      filename: resolved,
      locals: {}
    });
    fs.writeFileSync(writeLocation + '/index.html', output);
    log('complete', file);
  });
  next();
}


/**
 * Gets the template variables from file. This way you can pass in template vars
 * using the component.json file.
 *
 * @param  {Object} templateConfig Path to the template config file.
 *                                 This loads the template variables into the template
 *                                 processor
 * @return {Object}                This loads and returns template variables to be used
 *                                 for swig processing
 */
function loadJson(jsonPath) {
  if (fs.existsSync(path.resolve(jsonPath))) {
    return JSON.parse(fs.readFileSync('./' + jsonPath, 'utf8'));
  }
  return {};
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
}

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