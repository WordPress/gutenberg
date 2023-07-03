# Data Plugins

Included here are a set of default plugin integrations for the WordPress data module.

## Usage

For any of the plugins included here as directories, call the `use` method to include its behaviors in the registry.

```js
// npm Usage
import { plugins, use } from '@wordpress/data';
use( plugins.persistence );

// WordPress Globals Usage
wp.data.use( wp.data.plugins.persistence );
```
