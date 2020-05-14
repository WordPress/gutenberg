/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationList } from '@wordpress/block-editor';
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
					<__experimentalBlockNavigationList
						blocks={ blocks }
						selectedBlockClientId={ selectedBlockClientIds[ 0 ] }
						selectBlock={ selectBlock }
						__experimentalWithBlockNavigationSlots={ true }
						showNestedBlocks
						showAppender
					/>
				) }
			</PanelBody>
		</Panel>
	);
}
