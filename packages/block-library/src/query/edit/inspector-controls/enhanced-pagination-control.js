/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useUnsupportedBlocks } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const { hasUnsupportedBlocks } = useUnsupportedBlocks( clientId );
	const fullClientSideNavigation =
		window.__experimentalFullClientSideNavigation;

	let help = __( 'Browsing between pages requires a full page reload.' );
	if ( fullClientSideNavigation ) {
		help = __( 'Full client-side navigation enabled.' );
	} else if ( enhancedPagination ) {
		help = __(
			"Browsing between pages won't require a full page reload, unless non-compatible blocks are detected."
		);
	} else if ( hasUnsupportedBlocks ) {
		help = __(
			"Force page reload can't be disabled because there are non-compatible blocks inside the Query block."
		);
	}

	return (
		<>
			<ToggleControl
				label={ __( 'Force page reload' ) }
				help={ help }
				checked={ ! enhancedPagination && ! fullClientSideNavigation }
				disabled={ hasUnsupportedBlocks || fullClientSideNavigation }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: ! value,
					} );
				} }
			/>
		</>
	);
}
