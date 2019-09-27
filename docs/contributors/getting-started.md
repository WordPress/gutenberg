# Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The first step is to install a recent version of Node. The easiest way (on MacOS, Linux, or Windows 10 with the Linux Subsystem) is by installing and running [nvm]. Once `nvm` is installed, you can install the correct version of Node by running `nvm install` in the Gutenberg directory.

Once you have Node installed, run these scripts:

```
npm install
npm run build
```

This will build Gutenberg, ready to be used as a WordPress plugin!

If you don't have a local WordPress environment to load Gutenberg in, we can help get that up and running, too.

## Local Environment

The quickest way to get up and running is to use the provided Docker setup. If you don't already have it, you'll need to install Docker by following their instructions for [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other version of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), or [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script).

Once Docker is installed and running, run this script to install WordPress, and build your local environment:

```
npm run env install
```

WordPress will be installed in the `wordpress` directory, if you need to access WordPress core files directly, you can find them there.

If you already have WordPress checked out in a different directory, you can use that installation, instead, by running these commands:

```
export WP_DEVELOP_DIR=/path/to/wordpress-develop
npm run env connect
```

This will use WordPress' own local environment, and mount your Gutenberg directory as a volume there.

In Windows, you can set the `WP_DEVELOP_DIR` environment variable using the appropriate method for your shell:

    CMD: set WP_DEVELOP_DIR=/path/to/wordpress-develop
    PowerShell: $env:WP_DEVELOP_DIR = "/path/to/wordpress-develop"

The WordPress installation should be available at `http://localhost:8889` (**Username**: `admin`, **Password**: `password`).
If this port is in use, you can override it using the `LOCAL_PORT` environment variable. For example, `export LOCAL_PORT=7777` will change the URL to `http://localhost:7777` . If you're running [e2e tests](/docs/contributors/testing-overview.md#end-to-end-testing), this change will be used correctly.

To bring down this local WordPress instance later run `npm run env stop`. To bring it back up again, run `npm run env start`.

WordPress comes with specific [debug systems](https://wordpress.org/support/article/debugging-in-wordpress/) designed to simplify the process as well as standardize code across core, plugins and themes. It is possible to use environment variables (`LOCAL_WP_DEBUG` and `LOCAL_SCRIPT_DEBUG`) to update a site's configuration constants located in `wp-config.php` file. Both flags can be disabled at any time by running the following command:
```
LOCAL_SCRIPT_DEBUG=false LOCAL_WP_DEBUG=false npm run env install
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
