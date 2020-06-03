/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { __experimentalBlockNavigationTree } from '@wordpress/block-editor';
import {
	Card,
	CardHeader,
	CardBody,
	Panel,
	PanelBody,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function NavigationStructureArea( { blocks, initialOpen } ) {
	const isSmallScreen = useViewportMatch( 'medium', '<' );
	const selectedBlockClientIds = useSelect(
		( select ) => select( 'core/block-editor' ).getSelectedBlockClientIds(),
		[]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const showNavigationStructure = !! blocks.length;

	const content = showNavigationStructure && (
		<__experimentalBlockNavigationTree
			blocks={ blocks }
			selectedBlockClientId={ selectedBlockClientIds[ 0 ] }
			selectBlock={ selectBlock }
			__experimentalFeatures
			showNestedBlocks
			showAppender
			showBlockMovers
		/>
	);

	return isSmallScreen ? (
		<Panel className="edit-navigation-menu-editor__navigation-structure-panel">
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ initialOpen }
			>
				{ content }
			</PanelBody>
		</Panel>
	) : (
		<Card className="edit-navigation-menu-editor__navigation-structure-card">
			<CardHeader className="edit-navigation-menu-editor__navigation-structure-header">
				{ __( 'Navigation structure' ) }
			</CardHeader>
			<CardBody>{ content }</CardBody>
		</Card>
	);
}
