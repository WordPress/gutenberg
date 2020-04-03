/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationList } from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

export default function NavigationStructurePanel( { blocks } ) {
	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<Panel>
			<PanelBody
				title={ __( 'Navigation structure' ) }
				initialOpen={ isLargeViewport }
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
