# React Native Editor

This package provides a demo application to simplify the environment setup required for the development of Gutenberg for native Android and iOS. The demo application allows running the mobile versions of Gutenberg blocks while avoiding the additional setup steps required by the [WordPress Android](https://github.com/wordpress-mobile/WordPress-Android) and [WordPress iOS](https://github.com/wordpress-mobile/WordPress-iOS) apps.

> **Status:** This package is unmaintained on `trunk` and is known to be broken following the upgrade to React 19 ([#61521](https://github.com/WordPress/gutenberg/pull/61521)). To patch the existing Gutenberg Mobile build, branch from the most recent React Native release — tag [`rnmobile/1.121.0`](https://github.com/WordPress/gutenberg/releases/tag/rnmobile%2F1.121.0) at commit [`e63b8b8`](https://github.com/WordPress/gutenberg/commit/e63b8b8be7bdc5e9dd2781c597e918a7be212fe5) (see [#63744](https://github.com/WordPress/gutenberg/pull/63744)) — and cut a minor release from there. See the [React Native mobile editor project status](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/react-native/README.md#project-status) for background.

## Getting Started

Please review [Getting Started for the React Native based Mobile Gutenberg](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/react-native/getting-started-react-native.md) to learn how to set up and run this demo application.

## License

Gutenberg Mobile is an Open Source project covered by the [GNU General Public License version 2](LICENSE).

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
