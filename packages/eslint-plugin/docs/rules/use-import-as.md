# Enforce configured import `as` names (use-import-as)

Enforces local `as` names for specific named imports based on rule options provided by the consumer.

It also checks destructuring from `unlock( privateApis )` when the `privateApis` identifier can be traced back to a configured `@wordpress/*` package import.

## Rule details

Given this ESLint configuration:

```json
{
	"rules": {
		"@wordpress/use-import-as": [
			"error",
			{
				"@wordpress/components": {
					"VisuallyHidden": "WCVisuallyHidden"
				}
			}
		]
	}
}
```

Examples of **incorrect** code for this rule:

```js
import { VisuallyHidden } from '@wordpress/components';

import { Button, VisuallyHidden as Hidden } from '@wordpress/components';

import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );
```

Examples of **correct** code for this rule:

```js
import { VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';

import { Button, VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';

import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );
```
