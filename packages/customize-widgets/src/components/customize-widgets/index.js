/**
 * WordPress dependencies
 */
import { useState, useEffect, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from '../sidebar-block-editor';
import FocusControl from '../focus-control';
import SidebarControls from '../sidebar-controls';

export default function CustomizeWidgets( {
	api,
	sidebarControls,
	blockEditorSettings,
} ) {
	const [ activeSidebarControl, setActiveSidebarControl ] = useState( null );

	useEffect( () => {
		const unsubscribers = sidebarControls.map( ( sidebarControl ) =>
			sidebarControl.subscribe( ( expanded ) => {
				if ( expanded ) {
					setActiveSidebarControl( sidebarControl );
				}
			} )
		);

		return () => {
			unsubscribers.forEach( ( unsubscriber ) => unsubscriber() );
		};
	}, [ sidebarControls ] );

	const activeSidebar =
		activeSidebarControl &&
		createPortal(
			<SidebarBlockEditor
				key={ activeSidebarControl.id }
				blockEditorSettings={ blockEditorSettings }
				sidebar={ activeSidebarControl.sidebarAdapter }
				inserter={ activeSidebarControl.inserter }
				inspector={ activeSidebarControl.inspector }
			/>,
			activeSidebarControl.container[ 0 ]
		);

	return (
		<SidebarControls
			sidebarControls={ sidebarControls }
			activeSidebarControl={ activeSidebarControl }
		>
			<FocusControl api={ api } sidebarControls={ sidebarControls }>
				{ activeSidebar }
			</FocusControl>
		</SidebarControls>
	);
}
