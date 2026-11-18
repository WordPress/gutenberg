# Encourage the use of recommended components (use-recommended-components)

Encourages the use of recommended UI components in a WordPress environment by flagging imports that have a better alternative. The component lists are maintained directly in the rule and represent an evolving, up-to-date set of guidance.

The rule checks named imports and direct destructuring from `unlock( privateApis )` when the `privateApis` identifier can be traced back to a package with a denylist entry.

## Rule details

Examples of **incorrect** code for this rule:

```js
// @wordpress/ui — this component isn't recommended yet.
import { SomeComponent } from '@wordpress/ui';
// @wordpress/components — a newer alternative is available.
import { Tabs } from '@wordpress/components';
import { RadioControl } from '@wordpress/components';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );
```

Examples of **correct** code for this rule:

```js
// Packages not covered by the rule are unaffected.
import { Button } from '@wordpress/components';
// Default and namespace imports are not checked.
import UI from '@wordpress/ui';
import { Tabs } from '@wordpress/ui';
import { Radio, RadioGroup, RadioGroupControl } from '@wordpress/ui';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../lock-unlock';

const { SomethingElse } = unlock( componentsPrivateApis );
```

## Inline exceptions

Prefer placing `eslint-disable-next-line` immediately above the individual import specifier in a multiline import. This keeps other components in the import checked, including components added later.

```js
import {
	Field,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of Menu.
	Menu,
	Stack,
} from '@wordpress/ui';
```

## Options

This rule has an object option:

- `allowUseWithCaution` (default: `false`): allow `@wordpress/ui` components that are marked "Use with caution" in Storybook. These components are ready for use, but their APIs or behavior may still change. Opt in only if you can follow those changes. They are also not advised to be mixed with existing components from `@wordpress/components` in the same interface, because their visual design and behavior can differ.

Examples of **correct** code for this rule with the `{ "allowUseWithCaution": true }` option:

```js
/* eslint @wordpress/use-recommended-components: ["error", { "allowUseWithCaution": true }] */
import { Button, Dialog } from '@wordpress/ui';
```
