/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function Layout( { blockEditorSettings } ) {
	const hasSidebarEnabled = useSelect( ( select ) => {
		return !! select( 'core/interface' ).getActiveComplementaryArea(
			'core/edit-widgets'
		);
	} );
	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<InterfaceSkeleton
				header={ <Header /> }
				sidebar={
					hasSidebarEnabled && (
						<ComplementaryArea.Slot scope="core/edit-widgets" />
					)
				}
				content={ <WidgetAreasBlockEditorContent /> }
			/>
			<Sidebar />
			<Popover.Slot />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
