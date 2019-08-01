# Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The easiest way to get started (on MacOS, Linux, or Windows 10 with the Linux Subsystem) is by running the Local Environment setup script, `./bin/setup-local-env.sh`. This will check if you have everything installed and updated, and help you download any extra tools you need.

For another version of Windows, or if you prefer to set things up manually, be sure to have <a href="https://nodejs.org/en/">Node.js installed first</a>. You should be running a Node version matching the [current active LTS release](https://github.com/nodejs/Release#release-schedule) or newer for this plugin to work correctly. You can check your Node.js version by typing `node -v` in the Terminal prompt.

If you have an incompatible version of Node in your development environment, you can use [nvm] to change node versions on the command line:

```
nvm install
nvm use
```

You also should have the latest release of [npm installed][npm]. npm is a separate project from Node.js and is updated frequently. If you've just installed Node.js which includes a version of npm within the installation you most likely will need also to update your npm installation. To update npm, type this into your terminal: `npm install npm@latest -g`

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

## Local Environment

First, you need a WordPress Environment to run the plugin on. The quickest way to get up and running is to use the provided docker setup. Install [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) by following the most recent instructions on the docker site.

In the folder of your preference, clone this project and enter the working directory:
```bash
git clone git@github.com:WordPress/gutenberg.git
cd gutenberg
```

Then, run a setup script to check if docker and node are configured properly and starts the local WordPress instance. You may need to run this script multiple times if prompted.
```
./bin/setup-local-env.sh
```

**If you're developing themes, or core WordPress functionality alongside Gutenberg**, you can make the WordPress files accessible in `wordpress/` by following these instructions instead:

1. If this is your first time setting up the environment, run `DOCKER_ENV=localwpdev ./bin/setup-local-env.sh` instead of `./bin/setup-local-env.sh`
2. If you've already had the previous environment set up, you need to start fresh, and you can do that by first running `docker-compose down --rmi all`. After that, you can repeat step 1.
3. If you turn off your computer or restart Docker, you can get your local WordPress dev environment back by typing `docker-compose -f docker-compose.yml -f docker-compose-localdev.yml up`. If you just run `docker-compose up`, you will get the vanilla install that doesn't expose the WordPress folder.

**If everything was successful**, you'll see the following ASCII art:
```
Welcome to...

,⁻⁻⁻·       .                 |
|  ،⁓’.   . |---  ,---. ,---. |---. ,---. ,---. ,---.
|   | |   | |     |---' |   | |   | |---' |     |   |
`---' `---' `---’ `---’ '   ` `---' `---’ `     `---|
                                                `---'
```

The WordPress installation should be available at `http://localhost:8888` (**Username**: `admin`, **Password**: `password`).
Inside the "docker" directory, you can use any docker command to interact with your containers. If this port is in use, you can override it in your `docker-compose.override.yml` file. If you're running [e2e tests](/docs/contributors/testing-overview.md#end-to-end-testing), this change will be used correctly.

To bring down this local WordPress instance later run:
```
docker-compose down
```

If you'd like to see your changes reflected in this local WordPress instance, run:
```
npm install
npm run dev
```

Alternatively, you can use your own local WordPress environment and clone this repository right into your `wp-content/plugins` directory.

Next, open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

WordPress comes with specific [debug systems](https://wordpress.org/support/article/debugging-in-wordpress/) designed to simplify the process as well as standardize code across core, plugins and themes. It is possible to use environment variables (`WP_DEBUG` and `SCRIPT_DEBUG`) to update a site's configuration constants located in `wp-config.php` file. Both flags can be disabled at any time by running the following command:
```
SCRIPT_DEBUG=false WP_DEBUG=false ./bin/setup-local-env.sh
```
By default, both flags will be set to `true`.

## On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your web server and activate the plugin from the WordPress admin.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

[npm]: https://www.npmjs.com/
[nvm]: https://github.com/creationix/nvm

## Playground

The Gutenberg repository also includes a static Gutenberg playground that allows testing and developing in a WordPress-agnostic context. This is very helpful for developing reusable components and trying generic JavaScript modules without any backend dependency.

You can launch the playground by running `npm run playground:start` locally. The playground should be available on [http://localhost:1234](http://localhost:1234).

You can also test the playground version of the current master branch on GitHub Pages: [https://wordpress.github.io/gutenberg/](https://wordpress.github.io/gutenberg/)
