/**
 * WordPress dependencies
 */
import { Popover, Panel } from '@wordpress/components';
import { BlockInspector } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { InterfaceSkeleton } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Header from '../header';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function Layout( { blockEditorSettings } ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<InterfaceSkeleton
				header={ <Header /> }
				sidebar={
					! isMobile && (
						<div className="edit-widgets-sidebar">
							<Panel header={ __( 'Block Areas' ) }>
								<BlockInspector
									showNoBlockSelectedMessage={ false }
								/>
							</Panel>
						</div>
					)
				}
				content={ <WidgetAreasBlockEditorContent /> }
			/>
			<Popover.Slot />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
