## Generated PHP

Generated PHP loaders must remain safe during rolling deployments, when an entry point can become available before a referenced file. Before adding a `require` or `require_once` for a generated artifact, check that the file exists and skip the include or return instead of causing a fatal error.
