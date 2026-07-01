/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
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
 * open closes it. Returns `null` when no attribute needs the drawer (none, or
 * all already promoted inline), so chrome can mount it unconditionally.
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

	// Surface the drawer only when there are attributes not already promoted
	// inline; if every attribute is high-relevance, the drawer would just
	// repeat the toolbar.
	const hasNonPromotedAttributes = widgetType.attributes?.some(
		( attribute ) => attribute.relevance !== 'high'
	);
	if ( ! hasNonPromotedAttributes ) {
		return null;
	}

	return (
		<IconButton
			icon={ moreVertical }
			label={ __( 'Widget settings' ) }
			variant="minimal"
			tone="neutral"
			size="compact"
			onClick={ toggle }
		/>
	);
}
