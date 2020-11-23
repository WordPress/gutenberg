# MainDashboardButton

This slot allows replacing the default main dashboard button in the post editor 
that's used for closing the editor in fullscreen mode. In the site editor this slot
refers to the "back to dashboard" button in the navigation sidebar.

## Examples

Basic usage:

```js
import { registerPlugin } from '@wordpress/plugins';
import {
	__experimentalMainDashboardButton as MainDashboardButton,
} from '@wordpress/interface';

const MainDashboardButtonTest = () => (
    <MainDashboardButton>
        Custom main dashboard button content
    </MainDashboardButton>
);

registerPlugin( 'main-dashboard-button-test', {
	render: MainDashboardButtonTest,
} );
```

If your goal is just to replace the icon of the existing button in
the post editor, that can be achieved in the following way:

```js
import { registerPlugin } from '@wordpress/plugins';
import {
	__experimentalFullscreenModeClose as FullscreenModeClose,
} from '@wordpress/edit-post';
import {
	__experimentalMainDashboardButton as MainDashboardButton,
} from '@wordpress/interface';
import { close } from '@wordpress/icons';


const MainDashboardButtonIconTest = () => (
    <MainDashboardButton>
        <FullscreenModeClose icon={ close } />
    </MainDashboardButton>
);

registerPlugin( 'main-dashboard-button-icon-test', {
	render: MainDashboardButtonIconTest,
} );
```

Site editor example:

```js
import { registerPlugin } from '@wordpress/plugins';
import {
	__experimentalMainDashboardButton as MainDashboardButton,
} from '@wordpress/interface';
import {
	__experimentalNavigationBackButton as NavigationBackButton,
} from '@wordpress/components';

const MainDashboardButtonIconTest = () => (
    <MainDashboardButton>
        <NavigationBackButton
            backButtonLabel={ __( 'Back to dashboard' ) }
            className="edit-site-navigation-panel__back-to-dashboard"
            href="index.php"
        />
    </MainDashboardButton>
);

registerPlugin( 'main-dashboard-button-icon-test', {
	render: MainDashboardButtonIconTest,
} );
```
