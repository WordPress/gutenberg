/**
 * WordPress dependencies
 */
import { ToggleControl, Notice } from '@wordpress/components';
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
	const {
		hasBlocksFromPlugins,
		hasPostContentBlock,
		hasPatternOrTemplatePartBlocks,
	} = useUnsupportedBlocks( clientId );

	const showAuto =
		! hasBlocksFromPlugins &&
		! hasPostContentBlock &&
		hasPatternOrTemplatePartBlocks;

	let notice = null;
	if ( hasBlocksFromPlugins ) {
		notice =
			'Blocks from plugins are not supported yet. For the enhanced pagination to work, remove the blocks, then re-enable "Enhanced pagination" in the Query Block settings.';
	} else if ( hasPostContentBlock ) {
		notice = __(
			'The Post Content block is not supported yet. For the enhanced pagination to work, remove the block, then re-enable "Enhanced pagination" in the Query Block settings.'
		);
	} else if ( enhancedPagination && hasPatternOrTemplatePartBlocks ) {
		notice = __(
			'Blocks from plugins are not supported yet. Please note that if you add them to the patterns or template parts that are currently inside this Query block, this enhanced pagination will be automatically disabled.'
		);
	}

	const label = showAuto
		? __( 'Enhanced pagination (auto)' )
		: __( 'Enhanced pagination' );

	return (
		<>
			<ToggleControl
				label={ label }
				help={ __(
					'Browsing between pages won’t require a full page reload.'
				) }
				checked={ !! enhancedPagination }
				disabled={ hasBlocksFromPlugins || hasPostContentBlock }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: !! value,
					} );
				} }
			/>
			{ notice && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="wp-block-query__enhanced-pagination-notice"
				>
					{ notice }
				</Notice>
			) }
		</>
	);
}
