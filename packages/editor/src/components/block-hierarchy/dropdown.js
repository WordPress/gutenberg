/**
 * WordPress dependencies
 */
import { IconButton, Dropdown, SVG } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockHierarchy from './';

const menuIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20">
		<path d="M5 5H3v2h2V5zm3 8h11v-2H8v2zm9-8H6v2h11V5zM7 11H5v2h2v-2zm0 8h2v-2H7v2zm3-2v2h11v-2H10z" />
	</SVG>
);

function BlockHierarchyDropdown( { rootClientId, selectedBlockClientId, countInnerBlocks } ) {
	if ( rootClientId === selectedBlockClientId && countInnerBlocks === 0 ) {
		return null;
	}

	return	(
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					icon={ menuIcon }
					aria-expanded={ isOpen }
					onClick={ onToggle }
					label={ __( 'Block Hierarchy' ) }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<BlockHierarchy onSelect={ onClose } />
			) }
		/>
	);
}

export default withSelect( ( select ) => {
	const {
		getSelectedBlockClientId,
		getBlockHierarchyRootClientId,
		getBlockCount,
	} = select( 'core/editor' );
	const selectedBlockClientId = getSelectedBlockClientId();
	const rootClientId = selectedBlockClientId && getBlockHierarchyRootClientId( selectedBlockClientId );
	return {
		countInnerBlocks: rootClientId ? getBlockCount( rootClientId ) : 0,
		rootClientId,
		selectedBlockClientId,
	};
} )( BlockHierarchyDropdown );
