/**
 * WordPress dependencies
 */
import { __experimentalNavigation as Navigation } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { GLOBAL_STYLES_VIEWS, VIEW_ROOT } from './navigation/constants';
import GlobalStylesNavigation from './navigation';
import GlobalStylesCurrentView from './navigation/view';

export default function GlobalStylesV2() {
	return (
		<GlobalStylesNavigation>
			<GlobalStylesView />
		</GlobalStylesNavigation>
	);
}

function GlobalStylesView() {
	return (
		<Navigation data={ GLOBAL_STYLES_VIEWS } initial={ VIEW_ROOT }>
			<GlobalStylesCurrentView />
		</Navigation>
	);
}
