# Contributing

## Installing & Building the Plugin

Gutenberg is a Node-based project, built primarily in JavaScript. Be sure to have <a href="https://nodejs.org/en/">Node installed first</a>. If you already have Node installed, make sure it's version 6.10.3 or higher for this plugin to work correctly. You can check your Node version by typing `node -v` in the Terminal prompt.

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

### On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your webserver and activate the plugin from the WordPress admin. You'll get a separate WordPress menu item called Gutenberg.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

### On a Local WordPress Environment

If you have a local WordPress environment, you can clone this repository right into your `wp-content/plugins` directory. `npm install` will get the dependencies set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

Some good options for a local WordPress development environment include <a href="https://varyingvagrantvagrants.org/">VVV</a> and <a href="https://www.mamp.info/">Mamp</a>.

## Workflow

A good workflow is to work directly in this repo, branch off `master`, and submit your changes as a pull request.

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/gallery-block` means you're working on adding a new gallery block. 

You can pick among all the <a href="https://github.com/WordPress/gutenberg/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/gutenberg/labels/Good%20First%20Task">Good First Task</a>.

## How Designers Can Contribute

If you'd like to contribute to the design or front-end, feel free to contribute to tickets labelled <a href="https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3ADesign">Design</a>. We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it so we can compare. If you use <a href="https://www.sketchapp.com/">Sketch</a>, you can grab <a href="https://cloudup.com/cMPXM8Va2cy">the source file for the mockups</a> (updated April 6th).
