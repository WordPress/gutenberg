# Encourage the use of recommended components (use-recommended-components)

Encourages the use of recommended UI components in a WordPress environment by flagging imports that have a better alternative. The component lists are maintained directly in the rule and represent an evolving, up-to-date set of guidance.

## Rule details

Examples of **incorrect** code for this rule:

```js
// @wordpress/ui — this component isn't recommended yet.
import { SomeComponent } from '@wordpress/ui';

// @wordpress/components — a newer alternative is available.
import { TextControl } from '@wordpress/components';
```

Examples of **correct** code for this rule:

```js
// Packages not covered by the rule are unaffected.
import { Button } from '@wordpress/components';

// Default and namespace imports are not checked.
import UI from '@wordpress/ui';
```
