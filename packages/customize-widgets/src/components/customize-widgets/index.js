/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, createPortal } from '@wordpress/element';
import { SlotFillProvider, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from '../sidebar-block-editor';
import FocusControl from '../focus-control';
import SidebarControls from '../sidebar-controls';
import useClearSelectedBlock from './use-clear-selected-block';

export default function CustomizeWidgets( {
	api,
	sidebarControls,
	blockEditorSettings,
} ) {
	const [ activeSidebarControl, setActiveSidebarControl ] = useState( null );
	const parentContainer = document.getElementById(
		'customize-theme-controls'
	);
	const popoverRef = useRef();

	useClearSelectedBlock( activeSidebarControl, popoverRef );

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

	// We have to portal this to the parent of both the editor and the inspector,
	// so that the popovers will appear above both of them.
	const popover =
		parentContainer &&
		createPortal(
			<div className="customize-widgets-popover" ref={ popoverRef }>
				<Popover.Slot />
			</div>,
			parentContainer
		);

	return (
		<SlotFillProvider>
			<SidebarControls
				sidebarControls={ sidebarControls }
				activeSidebarControl={ activeSidebarControl }
			>
				<FocusControl api={ api } sidebarControls={ sidebarControls }>
					{ activeSidebar }
					{ popover }
				</FocusControl>
			</SidebarControls>
		</SlotFillProvider>
	);
}
