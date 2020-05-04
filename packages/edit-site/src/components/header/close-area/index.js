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

const { Fill: __experimentalSiteEditorCloseArea, Slot } = createSlotFill(
	'__experimentalSiteEditorCloseArea'
);

__experimentalSiteEditorCloseArea.Slot = () => {
	return (
		<Slot>
			{ ( fills ) => {
				if ( isEmpty( fills ) ) {
					return <FullscreenModeClose />;
				}

				return <> { fills } </>;
			} }
		</Slot>
	);
};

export default __experimentalSiteEditorCloseArea;
