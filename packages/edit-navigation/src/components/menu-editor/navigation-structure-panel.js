/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationList } from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function NavigationStructurePanel( { blocks, initialOpen } ) {
	return (
		<Panel className="edit-navigation-menu-editor__navigation-structure-panel">
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ initialOpen }
			>
				{ !! blocks.length && (
					<__experimentalBlockNavigationList
						blocks={ blocks }
						selectedBlockClientId={ blocks[ 0 ].clientId }
						selectBlock={ () => {} }
						showNestedBlocks
						showAppender
					/>
				) }
			</PanelBody>
		</Panel>
	);
}
