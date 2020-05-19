/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
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
						<>
							<ComplementaryArea.Slot scope="core/edit-widgets" />
							<Sidebar />
						</>
					)
				}
				content={ <WidgetAreasBlockEditorContent /> }
			/>
			<Popover.Slot />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
