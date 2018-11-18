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

function TableOfContents( { hasBlocks } ) {
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
			renderContent={ () => <TableOfContentsPanel /> }
		/>
	);
}

export default withSelect( ( select ) => {
	return {
		hasBlocks: !! select( 'core/editor' ).getBlockCount(),
	};
} )( TableOfContents );
