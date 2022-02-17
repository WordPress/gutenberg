# Preferences

Utilities for storing WordPress preferences.

## Installation

Install the module

```bash
npm install @wordpress/preferences --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## API Usage

### Features

Features are boolean values used for toggling specific editor features on or off.

Set the default values for any features on editor initialization:

```js
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

function initialize() {
	// ...

	dispatch( preferencesStore ).setFeatureDefaults(
		'namespace/editor-or-plugin-name',
		{
			myFeatureName: true,
		}
	);

	// ...
}
```

Use the `toggleFeature` action and the `isFeatureActive` selector to toggle features within your app:

```js
wp.data
	.select( 'core/preferences' )
	.isFeatureActive( 'namespace/editor-or-plugin-name', 'myFeatureName' ); // true
wp.data
	.dispatch( 'core/preferences' )
	.toggleFeature( 'namespace/editor-or-plugin-name', 'myFeatureName' );
wp.data
	.select( 'core/preferences' )
	.isFeatureActive( 'namespace/editor-or-plugin-name', 'myFeatureName' ); // false
```

The `MoreMenuDropdown` and `MoreMenuFeatureToggle` components help to implement an editor menu for changing preferences and feature values.

```jsx
function MyEditorMenu() {
	return (
		<MoreMenuDropdown>
			{ () => (
				<MenuGroup label={ __( 'Features' ) }>
					<MoreMenuFeatureToggle
						scope="namespace/editor-or-plugin-name"
						feature="myFeatureName"
						label={ __( 'My feature' ) }
						info={ __( 'A really awesome feature' ) }
						messageActivated={ __( 'My feature activated' ) }
						messageDeactivated={ __( 'My feature deactivated' ) }
					/>
				</MenuGroup>
			) }
		</MoreMenuDropdown>
	);
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
