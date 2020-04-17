/**
 * WordPress dependencies
 */
import {
	__experimentalBlockNavigationToolbar as BlockNavigationToolbar,
	__experimentalBlockNavigationList as BlockNavigationList,
	NavigableToolbar,
} from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function NavigationStructurePanel( { blocks, initialOpen } ) {
	const selectedBlockClientIds = useSelect(
		( select ) => select( 'core/block-editor' ).getSelectedBlockClientIds(),
		[]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );

	return (
		<Panel className="edit-navigation-menu-editor__navigation-structure-panel">
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ initialOpen }
			>
				{ !! blocks.length && (
					<>
						<NavigableToolbar
							aria-label={ __( 'Navigation structure tools' ) }
						>
							<BlockNavigationToolbar />
						</NavigableToolbar>
						<BlockNavigationList
							blocks={ blocks }
							selectedBlockClientId={
								selectedBlockClientIds[ 0 ]
							}
							selectBlock={ selectBlock }
							showNestedBlocks
							showAppender
						/>
					</>
				) }
			</PanelBody>
		</Panel>
	);
}
