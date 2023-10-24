/**
 * WordPress dependencies
 */
import { ToggleControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockTitle } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useUnsupportedBlockList } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
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
					{ __(
						"Enhanced pagination doesn't support the following blocks:"
					) }
					<ul>
						{ unsupported.map( ( id ) => (
							<li key={ id }>
								<BlockTitle clientId={ id } />
							</li>
						) ) }
					</ul>
					{ __(
						'If you want to enable it, you have to remove all unsupported blocks first.'
					) }
				</Notice>
			) }
		</>
	);
}
