# Babel Preset Default

Default [Babel](https://babeljs.io/) preset for WordPress development.

The preset includes configuration which enable language features and syntax extensions targeted for support by WordPress. This includes [ECMAScript proposals](https://github.com/tc39/proposals) which have reached [Stage 4 ("Finished")](https://tc39.es/process-document/), as well as the [JSX syntax extension](https://reactjs.org/docs/introducing-jsx.html). For more information, refer to the [JavaScript Coding Guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/coding-guidelines.md#javascript).

## Installation

Install the module

```bash
npm install @wordpress/babel-preset-default --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

### Usage

There are a number of methods to configure Babel. See [Babel's Configuration documentation](https://babeljs.io/docs/en/configuration) for more information. To use this preset, simply reference `@wordpress/default` in the `presets` option in your Babel configuration.

For example, using `.babelrc`:

```json
{
	"presets": [ "@wordpress/default" ]
}
```

#### Extending Configuration

This preset is an opinionated configuration. If you would like to add to or change this configuration, you can do so by expanding your Babel configuration to include plugins or presets which override those included through this preset. It may help to familiarize yourself [the implementation of the configuration](https://github.com/WordPress/gutenberg/blob/HEAD/packages/babel-preset-default/index.js) to see which specific plugins are enabled by default through this preset.

For example, if you'd like to use a new language feature proposal which has not reached the stability requirements of WordPress, you can add those as additional plugins in your Babel configuration:

```json
{
	"presets": [ "@wordpress/babel-preset-default" ],
	"plugins": [ "@babel/plugin-proposal-class-properties" ]
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
