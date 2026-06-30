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
 * Per-instance gear that opens the shared settings drawer by writing the
 * instance `uuid` to the UI context; the single `WidgetSettings` at the root
 * reacts to it. Returns `null` when the type declares no attributes, so chrome
 * can mount it unconditionally.
 *
 * @param {WidgetSettingsTriggerProps} props Component props.
 */
export function WidgetSettingsTrigger( {
	widget,
	widgetType,
}: WidgetSettingsTriggerProps ): React.ReactNode {
	const { setSettingsWidgetUuid } = useDashboardUIContext();

	const open = useCallback(
		() => setSettingsWidgetUuid( widget.uuid ),
		[ setSettingsWidgetUuid, widget.uuid ]
	);

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
			onClick={ open }
		/>
	);
}
