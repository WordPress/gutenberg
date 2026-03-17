## Gutenberg Plugin Assets

The contents of this directory are synced from the [`assets/` directory in the Gutenberg repository on GitHub](https://github.com/WordPress/gutenberg/tree/trunk/assets) to the [`assets/` directory of the Gutenberg WordPress.org plugin repository](https://plugins.trac.wordpress.org/browser/gutenberg/assets). **Any changes committed directly to the plugin repository on WordPress.org will be overwritten.**

The sync is performed by a [GitHub Actions workflow](https://github.com/WordPress/gutenberg/actions/workflows/sync-assets-to-plugin-repo.yml) that is triggered whenever a file in this directory is changed.

Since that workflow requires access to WP.org plugin repository credentials, it needs to be approved manually by a member of the Gutenberg Core team. If you don't have the necessary permissions, please ask someone in [#core-editor](https://wordpress.slack.com/archives/C02QB2JS7).
