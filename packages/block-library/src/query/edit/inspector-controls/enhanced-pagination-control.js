/**
 * WordPress dependencies
 */
import { ToggleControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useContainsThirdPartyBlocks } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const enhancedPaginationNotice = __(
		'Enhanced pagination only works with the blocks bundled with WordPress. If you want to enable it, you have to remove all plugin blocks from the Query Loop.'
	);

	const containsThirdPartyBlocks = useContainsThirdPartyBlocks( clientId );

	return (
		<>
			<ToggleControl
				label={ __( 'Enhanced pagination' ) }
				help={ __(
					'Browsing between pages won’t require a full page reload.'
				) }
				checked={ !! enhancedPagination }
				disabled={ containsThirdPartyBlocks }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: !! value,
					} );
				} }
			/>
			{ containsThirdPartyBlocks && (
				<div>
					<Notice status="warning" isDismissible={ false }>
						{ enhancedPaginationNotice }
					</Notice>
				</div>
			) }
		</>
	);
}
