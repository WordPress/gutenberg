/**
 * WordPress dependencies
 */
import { useState, useEffect, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from '../sidebar-block-editor';
import FocusControl from '../focus-control';

export default function CustomizeWidgets( {
	api,
	sidebarControls,
	blockEditorSettings,
} ) {
	const [ activeSidebar, setActiveSidebar ] = useState( null );

	useEffect( () => {
		const unsubscribers = sidebarControls.map( ( sidebarControl ) =>
			sidebarControl.subscribe( ( expanded ) => {
				if ( expanded ) {
					setActiveSidebar( sidebarControl );
				}
			} )
		);

		return () => {
			unsubscribers.forEach( ( unsubscriber ) => unsubscriber() );
		};
	}, [ sidebarControls ] );

	const sidebar =
		activeSidebar &&
		createPortal(
			<SidebarBlockEditor
				blockEditorSettings={ blockEditorSettings }
				sidebar={ activeSidebar.sidebarAdapter }
				inserter={ activeSidebar.inserter }
				inspector={ activeSidebar.inspector }
			/>,
			activeSidebar.container[ 0 ]
		);

	return (
		<FocusControl api={ api } sidebarControls={ sidebarControls }>
			{ sidebar }
		</FocusControl>
	);
}
