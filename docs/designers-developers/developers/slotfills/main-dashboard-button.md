# MainDashboardButton

This slot allows replacing the default main dashboard button that's used for closing
the editor in fullscreen mode.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { __experimentalMainDashboardButton } from '@wordpress/edit-site';

const MainDashboardButtonTest = () => (
    <__experimentalMainDashboardButton>
        Custom main dashboard button content
    </__experimentalMainDashboardButton>
);

registerPlugin( 'main-dashboard-button-test', {
	render: MainDashboardButtonTest,
} );
```

If your goal is just to replace the icon of the existing button, that can be achieved
in the following way:

```js
import { registerPlugin } from '@wordpress/plugins';
import { 
	__experimentalMainDashboardButton,
	__experimentalFullscrenModeClose
} from '@wordpress/edit-site';
import { close } from '@wordpress/icons';	
	

const MainDashboardButtonIconTest = () => (
    <__experimentalMainDashboardButton>
        <__experimentalFullscrenModeClose icon={ close } />
    </__experimentalMainDashboardButton>
);

registerPlugin( 'main-dashboard-button-icon-test', {
	render: MainDashboardButtonIconTest,
} );
```
