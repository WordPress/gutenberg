/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FullscreenModeClose from '../fullscreen-mode-close';

const { Fill: MainDashboardButton, Slot } = createSlotFill(
	'SiteEditorMainDashboardButton'
);

MainDashboardButton.Slot = () => (
	<Slot>
		{ ( fills ) => {
			// Return default Close button if no fills are provided, otherwise replace it with available fills.
			if ( isEmpty( fills ) ) {
				return <FullscreenModeClose />;
			}

			return <> { fills } </>;
		} }
	</Slot>
);

export default MainDashboardButton;
