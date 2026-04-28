/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, createPortal } from '@wordpress/element';
import {
	SlotFillProvider,
	Popover,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import SidebarBlockEditor from '../sidebar-block-editor';
import FocusControl from '../focus-control';
import SidebarControls from '../sidebar-controls';
import useClearSelectedBlock from './use-clear-selected-block';
import { unlock } from '../../lock-unlock';

const { __experimentalGetOverlayLegacySlot: getOverlayLegacySlot } = unlock(
	componentsPrivateApis
);

export default function CustomizeWidgets( {
	api,
	sidebarControls,
	blockEditorSettings,
} ) {
	const [ activeSidebarControl, setActiveSidebarControl ] = useState( null );
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
			<ErrorBoundary>
				<SidebarBlockEditor
					key={ activeSidebarControl.id }
					blockEditorSettings={ blockEditorSettings }
					sidebar={ activeSidebarControl.sidebarAdapter }
					inserter={ activeSidebarControl.inserter }
					inspector={ activeSidebarControl.inspector }
				/>
			</ErrorBoundary>,
			activeSidebarControl.container[ 0 ]
		);

	// Portal this into the overlay legacy slot so popovers appear above both
	// the editor and the inspector. The slot's stacking context (above the
	// customizer panes, below the WP admin bar) handles the layering.
	const popover = createPortal(
		<div className="customize-widgets-popover" ref={ popoverRef }>
			<Popover.Slot />
		</div>,
		getOverlayLegacySlot()
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
