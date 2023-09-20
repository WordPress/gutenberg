/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../../use-setting';

export default function useSpacingSizes() {
	const spacingSizes = [
		{ name: 0, slug: '0', size: 0 },
		...( useSetting( 'spacing.spacingSizes' ) || [] ),
	];

	if ( spacingSizes.length > 8 ) {
		spacingSizes.unshift( {
			name: __( 'Default' ),
			slug: 'default',
			size: undefined,
		} );
	}

	return spacingSizes;
}
