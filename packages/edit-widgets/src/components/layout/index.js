/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function Layout( { blockEditorSettings } ) {
	const hasSidebarEnabled = useSelect(
		( select ) =>
			!! select( 'core/interface' ).getActiveComplementaryArea(
				'core/edit-widgets'
			)
	);
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
				content={
					<WidgetAreasBlockEditorContent
						blockEditorSettings={ blockEditorSettings }
					/>
				}
			/>
			<Sidebar />
			<Popover.Slot />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
