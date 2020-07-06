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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function NavigationStructureArea( { blocks, initialOpen } ) {
	const [ selectedBlockId, setSelectedBlockId ] = useState( null );
	const isSmallScreen = useViewportMatch( 'medium', '<' );
	const showNavigationStructure = !! blocks.length;

	const content = showNavigationStructure && (
		<__experimentalBlockNavigationTree
			blocks={ blocks }
			selectedBlockClientId={ selectedBlockId }
			selectBlock={ ( id ) => {
				setSelectedBlockId( id );
			} }
			__experimentalFeatures
			showNestedBlocks
			showAppender
			showBlockMovers
		/>
	);

	return isSmallScreen ? (
		<Panel className="edit-navigation-editor__navigation-structure-panel">
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ initialOpen }
			>
				{ content }
			</PanelBody>
		</Panel>
	) : (
		<Card className="edit-navigation-editor__navigation-structure-card">
			<CardHeader className="edit-navigation-editor__navigation-structure-header">
				{ __( 'Navigation structure' ) }
			</CardHeader>
			<CardBody>{ content }</CardBody>
		</Card>
	);
}
