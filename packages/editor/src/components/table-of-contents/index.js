/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TableOfContentsPanel from './panel';

function TableOfContents( { hasBlocks, hasOutlineItemsDisabled } ) {
	return (
		<Dropdown
			position="bottom"
			className="table-of-contents"
			contentClassName="table-of-contents__popover"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					onClick={ hasBlocks ? onToggle : undefined }
					icon="info-outline"
					aria-expanded={ isOpen }
					label={ __( 'Content structure' ) }
					labelPosition="bottom"
					aria-disabled={ ! hasBlocks }
				/>
			) }
			renderContent={ ( { onClose } ) => <TableOfContentsPanel onRequestClose={ onClose } hasOutlineItemsDisabled={ hasOutlineItemsDisabled } /> }
		/>
	);
}

export default withSelect( ( select ) => {
	return {
		hasBlocks: !! select( 'core/block-editor' ).getBlockCount(),
	};
} )( TableOfContents );
