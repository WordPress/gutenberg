# StyledScopeProvider

StyledScopeProvider is a component that adds CSS selector prefixing for styles rendered with [Emotion](https://github.com/emotion-js/emotion) (currently experimental within `@wordpress/components`).

Prefixing increases style specificity, allowing for a smoother integration into environments with pre-existing CSS rules.

## Usage

```jsx
import {
	__experimentalStyledScopeProvider as StyledScopeProvider,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';

const Example = () => (
	<StyledScopeProvider scope="html body #editor">
		...
		<InputControl />
		...
	</StyledScopeProvider>
);
```

In the above example, the `<InputControl />` component styles (which are generated with [Emotion](https://github.com/emotion-js/emotion)), will be prefixed with `html body #editor`.
Instead of the generated CSS selector of `.css-123jda`, it would instead be `html body #editor .css-123jda`. Increasing specificity in a controlled manner is helpful in situations where there may be conflicting styles.

In the case of `<InputControl />`, existing style rules such as `#editor input[type="text]` may pose problematic. However, the automatically generated selectors `html body #editor .css-123jda` will help ensure the elements are styled as expected.

## Props

The component accepts the following props:

#### scope

Prefix selectors the [Emotion](https://github.com/emotion-js/emotion) generated classNames.

-   Type: `String`
-   Required: No
-   Default: ''
