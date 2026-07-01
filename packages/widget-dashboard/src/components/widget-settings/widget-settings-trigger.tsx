/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import type { DashboardWidget } from '../../types';

export interface WidgetSettingsTriggerProps {
	/**
	 * The instance whose settings drawer this gear opens.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * The instance's widget type, used for the accessible label and the
	 * attributes guard.
	 */
	widgetType: WidgetType;
}

/**
 * Per-instance gear that toggles the shared settings drawer by writing the
 * instance `uuid` to the UI context; the single `WidgetSettings` at the root
 * reacts to it. Clicking the gear of the instance whose drawer is already
 * open closes it. Returns `null` when the type declares no attributes, so
 * chrome can mount it unconditionally.
 *
 * @param {WidgetSettingsTriggerProps} props Component props.
 */
export function WidgetSettingsTrigger( {
	widget,
	widgetType,
}: WidgetSettingsTriggerProps ): React.ReactNode {
	const { settingsWidgetUuid, setSettingsWidgetUuid } =
		useDashboardUIContext();
	const { cancel } = useDashboardInternalContext();

	const toggle = useCallback( () => {
		// Re-clicking the open instance's gear closes the drawer, discarding
		// staged edits like any other non-Save exit.
		if ( settingsWidgetUuid === widget.uuid ) {
			cancel();
			setSettingsWidgetUuid( null );
			return;
		}
		setSettingsWidgetUuid( widget.uuid );
	}, [ cancel, settingsWidgetUuid, setSettingsWidgetUuid, widget.uuid ] );

	if ( ! widgetType.attributes?.length ) {
		return null;
	}

	return (
		<IconButton
			icon={ cog }
			label={ __( 'Widget settings' ) }
			variant="minimal"
			tone="neutral"
			size="compact"
			onClick={ toggle }
		/>
	);
}
