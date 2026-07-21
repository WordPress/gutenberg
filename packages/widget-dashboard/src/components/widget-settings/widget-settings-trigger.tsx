/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useWidgetSettingsToggle } from './use-widget-settings-toggle';
import type { DashboardWidget } from '../../types';

export interface WidgetSettingsTriggerProps {
	/**
	 * The instance whose settings surface this control opens.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * The instance's widget type, used for the accessible label and the
	 * attributes guard.
	 */
	widgetType: WidgetType;
}

/**
 * Per-instance control that toggles the shared settings surface; the single
 * `WidgetSettings` at the root reacts to it. Clicking the control of the
 * instance whose settings surface is already open closes it. Returns `null`
 * when no attribute needs that surface (none, or all already promoted to the
 * prominent one), so chrome can mount it unconditionally.
 *
 * @param {WidgetSettingsTriggerProps} props Component props.
 */
export function WidgetSettingsTrigger( {
	widget,
	widgetType,
}: WidgetSettingsTriggerProps ): React.ReactNode {
	const { toggle } = useWidgetSettingsToggle( widget );

	// Surface the settings UI only when there are attributes not already
	// promoted inline; if every attribute is high-relevance, a second
	// surface would just repeat the prominent one.
	const hasNonPromotedAttributes = widgetType.attributes?.some(
		( attribute ) => attribute.relevance !== 'high'
	);
	if ( ! hasNonPromotedAttributes ) {
		return null;
	}

	return (
		<IconButton
			icon={ drawerRight }
			label={ __( 'Widget settings' ) }
			variant="minimal"
			tone="neutral"
			size="compact"
			onClick={ toggle }
		/>
	);
}
