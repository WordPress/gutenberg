/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { IconButton, Dropdown, SVG, Path, KeyboardShortcuts } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockNavigation from './';

const MenuIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
		<Path d="M5 5H3v2h2V5zm3 8h11v-2H8v2zm9-8H6v2h11V5zM7 11H5v2h2v-2zm0 8h2v-2H7v2zm3-2v2h11v-2H10z" />
	</SVG>
);

function BlockNavigationDropdown( { hasBlocks, isTextModeEnabled } ) {
	return	(
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Fragment>
					{ hasBlocks && ! isTextModeEnabled && <KeyboardShortcuts
						bindGlobal
						shortcuts={ {
							[ rawShortcut.access( 'o' ) ]: onToggle,
						} }
					/>
					}
					<IconButton
						icon={ MenuIcon }
						aria-expanded={ isOpen }
						onClick={ hasBlocks ? onToggle : undefined }
						label={ __( 'Block Navigation' ) }
						className="editor-block-navigation"
						shortcut={ displayShortcut.access( 'o' ) }
						disabled={ ! hasBlocks || isTextModeEnabled }
					/>
				</Fragment>
			) }
			renderContent={ ( { onClose } ) => (
				<BlockNavigation onSelect={ onClose } />
			) }
		/>
	);
}

export default withSelect( ( select ) => {
	return {
		hasBlocks: !! select( 'core/editor' ).getBlockCount(),
		isTextModeEnabled: select( 'core/edit-post' ).getEditorMode() === 'text',
	};
} )( BlockNavigationDropdown );
