const semanticReleaseConfig = (
  {
    name,
    srcRoot = `libs/${name}`,
  }
) => ({
  extends: 'release.config.base.js',
  pkgRoot: `dist/${srcRoot}`,
  tagFormat: name + "-v${version}",
  commitPaths: [`${srcRoot}/*`],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: `${srcRoot}/CHANGELOG.md`,
      },
    ],
    [
        '@semantic-release/npm',
        {
            npmPublish: true,

        },
    ],
    [
      '@semantic-release/npm',
      {
          npmPublish: false,
          pkgRoot: srcRoot,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [`${srcRoot}/package.json`, `${srcRoot}/CHANGELOG.md`],
        message:
          `release(version): Release ${name} ` +
          '${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
});

module.exports = {
  semanticReleaseConfig,
};