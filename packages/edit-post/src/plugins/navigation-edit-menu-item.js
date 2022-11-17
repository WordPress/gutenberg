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
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { __ } from '@wordpress/i18n';

const NavMenuSidebarToggle = () => {
 	// Blocks can be loaded into both post and site editors.
	// We use this to determine which editor we are in so that
	// we can determine which inspector controls to open.
	const {
		isPostEditor,
	} = useSelect(
		( select ) => {
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const editorSelectors = select( 'core/editor' );
			return {
				isPostEditor: !! editorSelectors.getEditedPostAttribute( 'type' )
			};
		}
	);

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const openBlockInspector = () => {
		if ( isPostEditor ) {
			openGeneralSidebar( 'edit-post/block' );
		} else {
			enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
		}
	};

	return (
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Open navigation list view' ) }
				onClick={ openBlockInspector }
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
