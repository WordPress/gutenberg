/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import type { DashboardWidget } from '../../types';

interface WidgetSettingsToggle {
	/**
	 * Whether this instance's settings surface is the open one.
	 */
	isOpen: boolean;

	/**
	 * Opens the settings surface for this instance.
	 */
	open: () => void;

	/**
	 * Closes the surface when this instance already owns it (discarding
	 * staged edits), opens it otherwise.
	 */
	toggle: () => void;
}

/**
 * Shared open/close logic for an instance's settings surface. The surface is
 * mounted once at the dashboard root and reacts to the `uuid` written into
 * the UI context; controls drive it through this hook.
 *
 * @param {DashboardWidget< unknown >} widget The instance whose settings surface the control drives.
 */
export function useWidgetSettingsToggle(
	widget: DashboardWidget< unknown >
): WidgetSettingsToggle {
	const { settingsWidgetUuid, setSettingsWidgetUuid } =
		useDashboardUIContext();
	const { cancel, flushAutoSave } = useDashboardInternalContext();

	const isOpen = settingsWidgetUuid === widget.uuid;

	const open = useCallback( () => {
		// Persist any pending prominent-surface edit before opening, so the
		// settings surface's edits stay isolated and its Cancel discards only
		// its own changes.
		flushAutoSave();
		setSettingsWidgetUuid( widget.uuid );
	}, [ flushAutoSave, setSettingsWidgetUuid, widget.uuid ] );

	const toggle = useCallback( () => {
		// Re-clicking the open instance's control closes the settings surface,
		// discarding staged edits like any other non-Save exit.
		if ( isOpen ) {
			cancel();
			setSettingsWidgetUuid( null );
			return;
		}
		open();
	}, [ isOpen, cancel, setSettingsWidgetUuid, open ] );

	return { isOpen, open, toggle };
}
