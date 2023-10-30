/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useHasBlocksFromPlugins,
	useHasPostContentBlock,
	useHasPatternsOrTemplateParts,
} from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const hasBlocksFromPlugins = useHasBlocksFromPlugins( clientId );
	const hasPostContentBlock = useHasPostContentBlock( clientId );
	const hasSyncedBlocks = useHasPatternsOrTemplateParts( clientId );

	const showAuto =
		! hasBlocksFromPlugins && ! hasPostContentBlock && hasSyncedBlocks;

	let notice = null;
	if ( hasBlocksFromPlugins ) {
		notice =
			'Blocks from plugins are not supported yet. For the enhanced pagination to work, remove the blocks, then re-enable "Enhanced pagination" in the Query Block settings.';
	} else if ( hasPostContentBlock ) {
		notice = __(
			'The Post Content block is not supported yet. For the enhanced pagination to work, remove the block, then re-enable "Enhanced pagination" in the Query Block settings.'
		);
	} else if ( enhancedPagination && hasSyncedBlocks ) {
		notice = __(
			'Blocks from plugins are not supported yet. Please note that if you add them to the patterns or template parts that are currently inside this Query block, this enhanced pagination will be automatically disabled.'
		);
	}

	return (
		<>
			<ToggleGroupControl
				label={ __( 'Enhanced pagination' ) }
				value={ enhancedPagination }
				help={ __(
					'Browsing between pages won’t require a full page reload.'
				) }
				onChange={ ( value ) =>
					setAttributes( { enhancedPagination: value } )
				}
				isBlock
			>
				<ToggleGroupControlOption
					value={ false }
					label={ __( 'Off' ) }
				/>
				<ToggleGroupControlOption
					value={ true }
					label={ showAuto ? __( 'Auto' ) : __( 'On' ) }
				/>
			</ToggleGroupControl>
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
