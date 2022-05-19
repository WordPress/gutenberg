# Folder Structure

The following snippet explains how the Gutenberg repository is structured omitting irrelevant or obvious items with further explanations:

    │
    ├── LICENSE
    ├── README.md
    ├── SECURITY.md
    ├── CONTRIBUTING.md
    ├── CODE_OF_CONDUCT.md
    │
    ├── .editorconfig
    ├── .eslintignore
    ├── .eslintrc
    ├── .jshintignore
    ├── .eslintignore
    ├── .prettierrc.js
    ├── .stylelintignore
    ├── .stylelintrc.json
    ├── .markdownlintignore
    ├── .npmpackagejsonlintrc.json
    ├── phpcs.xml.dist
    │   Dot files and config files used to configure the various linting tools
    │   used in the repository (PHP, JS, styles...).
    │
    ├── .browserslistrc
    ├── babel.config.js
    ├── jsconfig.json
    ├── tsconfig.json
    ├── tsconfig.base.json
    ├── webpack.config.js
    │   Transpilation and bundling Config files.
    │
    ├── .wp-env.json
    │   Config file for the development and testing environment.
    │   Includes WordPress and the Gutenberg plugin.
    │
    ├── composer.lock
    ├── composer.json
    │   Handling of PHP dependencies. Essentially used for development tools.
    │   The production code don't use external PHP dependencies.
    │
    ├── package-lock.json
    ├── package.json
    │	Handling of JavaScript dependencies. Both for development tools and
    │   production dependencies.
    │   The package.json also serves to define common tasks and scripts
    |   used for day to day development.
    │
    ├── changelog.txt
    ├── readme.txt
    │   Readme and Changelog of the Gutenberg plugin hosted on the WordPress
    │   plugin repository.
    │
    ├── gutenberg.php
    │   Entry point of the Gutenberg plugin.
    │
    ├── post-content.php
    │   Demo post content used on the Gutenberg plugin to showcase the editor.
    │
    ├── .github/*
    │   Config of the different GitHub features (issues and PR templates, CI, owners).
    │
    ├── bin/api-docs
    │   Tool/script used to generate the API Docs.
    │
    ├── bin/packages
    │   Set of scripts used to build the WordPress packages.
    │
    ├── bin/plugin
    │   Tool use to perform the Gutenberg plugin release and the npm releases as well.
    │
    ├── docs/tool
    │   Tool used to generate the Block editor handbook's markdown pages.
    │
    ├── docs/*.md
    │   Set of documentation pages composing the [Block editor handbook](https://developer.wordpress.org/block-editor/).
    │
    ├── lib
    │   PHP Source code of the Gutenberg plugin.
    │
    ├── packages
    │   Source code of the WordPress packages.
    │   Packages can be:
    │    - Production JavaScript scripts and styles loaded on WordPress
    │      and the Gutenberg plugin or distributed as npm packages.
    │    - Development tools available on npm.
    │
    ├── packages/{packageName}/package.json
    │   Dependencies of the current package.
    │
    ├── packages/{packageName}/CHANGELOG.md
    ├── packages/{packageName}/README.md
    │
    ├── packages/{packageName}/src/**/*.js
    ├── packages/{packageName}/src/**/*.scss
    │   Source code of a given package.
    |
    ├── packages/{packageName}/src/**/*.test.js
    │   JavaScript unit tests.
    |
    ├── packages/{packageName}/src/**/{ComponentName}/index.js
    │   Entry point of a given component.
    |
    ├── packages/{packageName}/src/**/{ComponentName}/style.scss
    │   Style entry point for a given component.
    │
    ├── packages/{packageName}/src/**/{ComponentName}/stories/*.js
    │   Component Stories to load on the Gutenberg storybook.
    │
    ├── packages/e2e-tests
    │   End-2-end tests of the Gutenberg plugin.
    │   Distributed as a package for potential reuse in Core and other plugins.
    │
    ├── phpunit
    │   Unit tests for the PHP code of the Gutenberg plugin.
    │
    ├── storybook
    │   Config of the [Gutenberg Storybook](https://wordpress.github.io/gutenberg/).
    │
    ├── test/integration
    │   Set of WordPress packages integration tests.
    │
    ├── test/native
    │   Configuration for the Gutenberg Mobile unit tests.
    │
    └── test/unit
    │   Configuration for the Packages unit tests.
    │
    └── tools/eslint
    │   Configuration files for the ESLint linter.
    │
    └── tools/webpack
    │   Configuration files for the webpack build.
