/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationTree } from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function NavigationStructurePanel( {
	blocks,
	initialOpen,
	...props
} ) {
	const selectedBlockClientIds = useSelect(
		( select ) => select( 'core/block-editor' ).getSelectedBlockClientIds(),
		[]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const showNavigationStructure = !! blocks.length;

	return (
		<Panel
			className="edit-navigation-menu-editor__navigation-structure-panel"
			{ ...props }
		>
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ initialOpen }
			>
				{ showNavigationStructure && (
					<__experimentalBlockNavigationTree
						blocks={ blocks }
						selectedBlockClientId={ selectedBlockClientIds[ 0 ] }
						selectBlock={ selectBlock }
						__experimentalWithBlockNavigationSlots
						__experimentalWithEllipsisMenu
						__experimentalWithEllipsisMenuMinLevel={ 2 }
						showNestedBlocks
						showAppender
						showBlockMovers
					/>
				) }
			</PanelBody>
		</Panel>
	);
}
