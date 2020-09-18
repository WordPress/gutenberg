# navigateRegions

`navigateRegions` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) adding keyboard navigation to switch between the different DOM elements marked as "regions" (role="region"). These regions should be focusable (By adding a tabIndex attribute for example). For better accessibility, these elements must be properly labelled to briefly describe the purpose of the content in the region. For more details, see "ARIA landmarks" in the [WAI-ARIA specification](https://www.w3.org/TR/wai-aria/).

## Example:

```jsx
import { navigateRegions } from '@wordpress/components';

const MyComponentWithNavigateRegions = navigateRegions( 
	() => (
		<div>
			<div role="region" tabIndex="-1" aria-label="Header">Header</div>
			<div role="region" tabIndex="-1" aria-label="Content">Content</div>
			<div role="region" tabIndex="-1" aria-label="Sidebar">Sidebar</div>
		</div>
	)
);
```
