# Editor configuration

Editor configuration is a package that stores configuration values for Gutenberg.

The package contains three different configuration files per environment:
- `config/development.js` - configuration values for local development environments and testing.
- `config/plugin.js` - configuration values for the Gutenberg plugin.
- `config/production.js` - configuration values for the block editor in Wordpress Core.

## Installation

Install the module

```bash
npm install @wordpress/editor-configuration --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

### Feature flags

Feature flags (also known as 'feature toggles') are boolean values that indicate whether a specific feature is active.

By defining a per-environment flag for a feature, fine-grain control can be achieved over when a feature is released. Generally a feature will initally only be enabled in `development` environments. Once it reaches a certain maturity, it can be enabled in the plugin. Finally, once a feature is ready for release, it can be enabled in production.

An advantage of feature flags is that a pull request implementing a new feature no longer needs to be held back from being merged into `master`. As long as the code passes review, a feature can be merged but disabled until it's ready to be released. 

### Adding a feature flag

For each configuration file, add a new item in the `features` object. Add new flags in alphabetical order to make it easier to browse them:

development.js
```javascript
export default {
	features: {
		// ...
		'editor/my-first-feature': true,
		// ...
	}
}
```

plugin.js / production.js
```javascript
export default {
	features: {
		// ...
		'editor/my-first-feature': false,
		// ...
	}
}
```

In the file(s) the feature is implemented, import the `getFeatureFlag` function from this package, and use it to determine whether the feature is active:
```javascript
import { getFeatureFlag } from '@wordpress/editor-configuration';

const isMyFirstFeatureActive = getFeatureFlag( 'editor/my-first-feature' );
```

Finally, avoid executing code that implements the feature at the earliest possible point:
```javascript
function myFirstFeature() {
	if ( ! isMyFirstFeatureActive ) {
		return;
	}

	// ... implementation of feature
}

```
