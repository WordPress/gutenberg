# `@wordpress/env`

> A zero-config, self contained local WordPress environment for development and testing.

## Usage

```sh
$ npm -g i @wordpress/env

$ cd path/to/gutenberg # WordPress install will be in path/to/gutenberg-wordpress.

$ wp-env --help

wp-env <command>

Commands:
  wp-env start [ref]          Starts WordPress for development on port 8888
                              (​http://localhost:8888​) and tests on port 8889
                              (​http://localhost:8889​). If the current working
                              directory is a plugin and/or has e2e-tests with
                              plugins and/or mu-plugins, they will be mounted
                              appropiately.
  wp-env stop                 Stops running WordPress for development and tests
                              and frees the ports.
  wp-env clean [environment]  Cleans the WordPress databases.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

### `$ wp-env start --help`

```sh
wp-env start [ref]

Starts WordPress for development on port 8888 (​http://localhost:8888​) and
tests on port 8889 (​http://localhost:8889​). If the current working directory
is a plugin and/or has e2e-tests with plugins and/or mu-plugins, they will be
mounted appropiately.

Positionals:
  ref  A `https://github.com/WordPress/WordPress` git repo branch or commit for
       choosing a specific version.                 [string] [default: "master"]
```

### `$ wp-env stop --help`

```sh
wp-env stop

Stops running WordPress for development and tests and frees the ports.
```

### `$ wp-env clean --help`

```sh
wp-env clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]
```
