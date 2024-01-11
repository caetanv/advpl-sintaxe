/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const runSequence = require('gulp4-run-sequence');
const es = require('event-stream');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');

const tsProject = ts.createProject('./tsconfig.json', {
  typescript
});

const inlineMap = true;
const inlineSource = false;
const outDest = 'out';

// If all VS Code langaues are support you can use nls.coreLanguages
const languagesCreate = [{ id: 'pt-br' }, { id: 'en' }];

gulp.task('default', function (callback) {
  runSequence('build', callback);
});

gulp.task('compile', function (callback) {
  runSequence('clean', 'internal-compile', callback);
});

gulp.task('build', function (callback) {
  runSequence('clean', 'internal-nls-compile', 'add-i18n', callback);
});

gulp.task('publish', function (callback) {
  runSequence('build', 'vsce:publish', callback);
});

gulp.task('package', function (callback) {
  runSequence('build', 'vsce:package', callback);
});

gulp.task('clean', function () {
  return del(['out/**', 'package.nls.*.json', 'i18n-sample*.vsix', '*.nls.*.json', 'snippets/*.nls.*.json']);
})

//---- internal

function compile(buildNls) {
  var r = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject()).js
    .pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
    .pipe(buildNls ? nls.createAdditionalLanguageFiles(languagesCreate, 'i18n', 'out') : es.through());

  if (inlineMap && inlineSource) {
    r = r.pipe(sourcemaps.write());
  } else {
    r = r.pipe(sourcemaps.write("../out", {
      // no inlined source
      includeContent: inlineSource,
      // Return relative source map root directories per file.
      sourceRoot: "../src"
    }));
  }

  return r.pipe(gulp.dest(outDest));
}

gulp.task('internal-compile', function () {
  return compile(false);
});

gulp.task('internal-nls-compile', function () {
  return compile(true);
});

gulp.task('add-i18n', function () {
  return gulp.src(['package.nls.json'])
    .pipe(nls.createAdditionalLanguageFiles(languagesCreate, 'i18n'))
    .pipe(gulp.dest('.'));
});

gulp.task('add-i18n-snippets', function () {
  return gulp
    .src(['./snippets/advpl.language.nls.json'])
    .pipe(nls.createAdditionalLanguageFiles(languagesCreate, 'i18n'))
    .pipe(gulp.dest('./snippets'));
});

gulp.task('vsce:publish', function () {
  return vsce.publish();
});

gulp.task('vsce:package', function () {
  return vsce.createVSIX();
});