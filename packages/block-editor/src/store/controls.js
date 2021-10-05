/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';
import { setBlockTypeImpressions } from '@wordpress/react-native-bridge';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

export const __unstableMarkAutomaticChangeFinalControl = function () {
	return {
		type: 'MARK_AUTOMATIC_CHANGE_FINAL_CONTROL',
	};
};

export const __unstableUpdateSettings = function ( settings ) {
	return {
		type: 'UPDATE_SETTINGS',
		settings,
	};
};

const controls = {
	UPDATE_SETTINGS( action ) {
		if ( Platform.isNative ) {
			const impressions = action?.settings?.impressions;
			if ( impressions ) {
				setBlockTypeImpressions( impressions );
			}
		}
		return action;
	},

	SLEEP( { duration } ) {
		return new Promise( ( resolve ) => {
			setTimeout( resolve, duration );
		} );
	},

	MARK_AUTOMATIC_CHANGE_FINAL_CONTROL: createRegistryControl(
		( registry ) => () => {
			const {
				requestIdleCallback = ( callback ) =>
					setTimeout( callback, 100 ),
			} = window;
			requestIdleCallback( () =>
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkAutomaticChangeFinal()
			);
		}
	),
};

export default controls;
