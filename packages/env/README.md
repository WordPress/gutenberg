# `@wordpress/env`

> A zero-config, self contained local WordPress environment for development and testing built on Docker.

## Requirements
One must have several software components installed on one's system before this environment can be successfully utilized.
* [Docker](https://www.docker.com/)
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/) - Is bundled with Node.js.
* Virtualization Technology - [VirtualBox](https://www.virtualbox.org/) is probably the most popular solution. Other solutions such as Microsoft Hyper-V and VMWare can work as well.

## Usage

```sh
$ npm -g i @wordpress/env

$ cd path/to/plugin-or-theme # WordPress install will be in path/to/plugin-or-theme-wordpress.

$ wp-env --help

wp-env <command>

Commands:
  wp-env start [ref]                  Starts WordPress for development on port
                                      8888 (​http://localhost:8888​) and tests
                                      on port 8889 (​http://localhost:8889​). If
                                      the current working directory is a plugin
                                      and/or has e2e-tests with plugins and/or
                                      mu-plugins, they will be mounted
                                      appropiately.
  wp-env stop                         Stops running WordPress for development
                                      and tests and frees the ports.
  wp-env clean [environment]          Cleans the WordPress databases.
  wp-env run <container> [command..]  Runs an arbitrary command in one of the
                                      underlying Docker containers.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

### `$ wp-env start --help`

```sh
wp-env start [ref]

Starts WordPress for development on port 8888 (​http://localhost:8888​)
(override with WP_ENV_PORT) and tests on port 8889 (​http://localhost:8889​)
(override with WP_ENV_TESTS_PORT). If the current working directory is a plugin
and/or has e2e-tests with plugins and/or mu-plugins, they will be mounted
appropriately.

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

### `$ wp-env run --help`

```sh
wp-env run <container> [command..]
Runs an arbitrary command in one of the underlying Docker containers.
Positionals:
  container  The container to run the command on.            [string] [required]
  command    The command to run.                           [array] [default: []]
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>

## Additional Configuration and Running with Multiple Plugins/Themes

`wp-env` also supports a configuration file. At the moment, this is only used for loading extra themes and plugins that you may be developing together with your main one. The script will attach the specified theme and plugin directories as volumes on the docker containers so that changes you make to them exist in the WordPress instance.

### Example:

`wp-env.json`
```json
{
  "themes": [
    "../path/to/theme/dir"
  ],
  "plugins": [
    "../path/to/plugin/dir"
  ]
}
```

### Caveats:

The file should be located in the same directory from which you run `wp-env` commands for a project. So if you are running `wp-env` in the root directory of a plugin, `wp-env.json` should also be located there. 

Each item in the `themes` or `plugins` array should be an absolute or relative path to the root of a different theme or plugin directory. Relative paths will be resolved from the current working directory, which means they will be resolved from the location of the `wp-env.json` file.
