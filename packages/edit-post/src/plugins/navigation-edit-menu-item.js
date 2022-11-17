/**
 * WordPress dependencies
 */
import {
	BlockEditorProvider,
	BlockTools,
	__unstableBlockToolbarLastItem,
	__unstableBlockNameContext,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { __ } from '@wordpress/i18n';

const NavMenuSidebarToggle = () => {
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );

	return (
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Open navigation list view' ) }
				onClick={ () => openGeneralSidebar( 'edit-post/block' ) }
			>
				{ __( 'Edit' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
};

// Conditionally include NavMenu sidebar in Plugin only.
// Optimise for dead code elimination.
// See https://github.com/WordPress/gutenberg/blob/trunk/docs/how-to-guides/feature-flags.md#dead-code-elimination.
let MaybeNavMenuSidebarToggle = Fragment;

const isOffCanvasNavigationEditorEnabled =
	window?.__experimentalEnableOffCanvasNavigationEditor === true;

if ( isOffCanvasNavigationEditorEnabled ) {
	MaybeNavMenuSidebarToggle = NavMenuSidebarToggle;
}

const NavigationEditMenuItem = () => {
	return (
		<BlockEditorProvider>
			<BlockTools>
				<__unstableBlockToolbarLastItem>
					<__unstableBlockNameContext.Consumer>
						{ ( blockName ) =>
							blockName === 'core/navigation' && (
								<MaybeNavMenuSidebarToggle />
							)
						}
					</__unstableBlockNameContext.Consumer>
				</__unstableBlockToolbarLastItem>
			</BlockTools>
			<ReusableBlocksMenuItems />
		</BlockEditorProvider>
	);
};

export default NavigationEditMenuItem;
