# WordPress Components: Doc Site

> Documentation site with live examples, generated from README.md files

## 🚨 Note: This project is very experimental and is a work in progress! 🚨

How this project is generated, and components like the custom Gutenberg blocks, are forks from a work-in-progress doc site generation project by [@itsjonq](https://github.com/ItsJonQ). The plan is to abstract the tooling and components and make those publicly available as easy to use npm packages.

## Getting Started

Once you've cloned down `@wordpress/gutenberg` onto your machine, install the project's dependencies by running:

```sh
npm install --prefix ./component-docs
```

Once the dependencies are downloaded, you can start up the docs local dev environment by running:

```sh
npm run docs:component-start
```

The local dev environment will be viewable at [http://localhost:4700/](http://localhost:4700/).

## How it Works

### Generating Data

A handful of scripts look for `README.md` files located in the `/packages/components/` directory. These files then run through a transformer to generate data that's consumable `.json` by the React app. These `.json` files are generated into the project's `/public` directory, allowing for the App to make serverless fetch requests for the `.json` files.

The idea behind this approach was to open the possibility of saving/serving the data from a REST API endpoint (e.g. a WordPress instance) in the future, if required.

During this process, additional data files are generated such as the `package.json` and Navigation data that the React app will use in it's UI. Since the React app will need immediate access to this data, the `.json` files are generated into a special `/component-docs/src/data/` directory.

### Development

This project uses [Create React App](https://github.com/facebook/create-react-app), which supports developer experience nicities like live reloading and linting.

### Live Component Examples

Live component examples can be rendered from the `README.md` files by wrapping examples with a special `wp:docs` tag:

```
<!-- wp:docs/sandbox { "name": "button" } -->
...
<!-- /wp:docs/sandbox -->
```

The React app uses custom Gutenberg blocks that transform that data. In the above example, the code snippet renders a live preview/editor, powered by [React Live](https://github.com/FormidableLabs/react-live).

### Build (Deploy)

This project can be built by running the following command:

```sh
npm run docs:component-build
```

Once completed, the built files can be found under `component-docs/build`.

The built files is a static site (or web app). The directory can be deployed onto any server or service that can render HTML.
