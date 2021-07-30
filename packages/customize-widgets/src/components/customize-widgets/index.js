/**
 * WordPress dependencies
 */
import { useRef, createPortal } from '@wordpress/element';
import { SlotFillProvider, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import SidebarBlockEditor from '../sidebar-block-editor';
import FocusControl from '../focus-control';
import { useActiveSidebarControl } from '../sidebar-controls';
import useClearSelectedBlock from './use-clear-selected-block';

export default function CustomizeWidgets( {
	api,
	sidebarControls,
	blockEditorSettings,
	onError,
} ) {
	const parentContainer = document.getElementById(
		'customize-theme-controls'
	);
	const popoverRef = useRef();

	const activeSidebarControl = useActiveSidebarControl();
	useClearSelectedBlock( activeSidebarControl, popoverRef );

	const activeSidebar =
		activeSidebarControl &&
		createPortal(
			<ErrorBoundary onError={ onError }>
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
			<FocusControl api={ api } sidebarControls={ sidebarControls }>
				{ activeSidebar }
				{ popover }
			</FocusControl>
		</SlotFillProvider>
	);
}
