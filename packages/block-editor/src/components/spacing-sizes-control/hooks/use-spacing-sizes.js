/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../../use-settings';

export default function useSpacingSizes() {
	const spacingSizes = [ { name: 0, slug: '0', size: 0 } ];

	const [ settingsSizes ] = useSettings( 'spacing.spacingSizes' );
	if ( settingsSizes ) {
		spacingSizes.push( ...settingsSizes );
	}

	if ( spacingSizes.length > 8 ) {
		spacingSizes.unshift( {
			name: __( 'Default' ),
			slug: 'default',
			size: undefined,
		} );
	}

	return spacingSizes;
}
