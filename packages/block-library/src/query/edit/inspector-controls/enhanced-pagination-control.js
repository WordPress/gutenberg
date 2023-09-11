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
		'This setting requires all descendants to be Core blocks. If you want to enable it, you have to remove all third-party blocks contained inside Post Template.'
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
					<Notice
						spokenMessage={ null }
						status="warning"
						isDismissible={ false }
					>
						{ enhancedPaginationNotice }
					</Notice>
				</div>
			) }
		</>
	);
}
