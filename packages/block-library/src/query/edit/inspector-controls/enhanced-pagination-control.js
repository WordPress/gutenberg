/**
 * WordPress dependencies
 */
import { ToggleControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useUnsupportedBlockList } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const enhancedPaginationNotice = __(
		"Enhanced pagination doesn't support plugin blocks or globally synced blocks yet. If you want to enable it, you have to remove all unsupported blocks from the Query Loop."
	);

	const unsupported = useUnsupportedBlockList( clientId );

	return (
		<>
			<ToggleControl
				label={ __( 'Enhanced pagination' ) }
				help={ __(
					'Browsing between pages won’t require a full page reload.'
				) }
				checked={ !! enhancedPagination }
				disabled={ unsupported.length }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: !! value,
					} );
				} }
			/>
			{ !! unsupported.length && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="wp-block-query__enhanced-pagination-notice"
				>
					{ enhancedPaginationNotice }
					<ul>
						{ unsupported.map( ( title ) => (
							<li key={ title }>{ title }</li>
						) ) }
					</ul>
				</Notice>
			) }
		</>
	);
}
