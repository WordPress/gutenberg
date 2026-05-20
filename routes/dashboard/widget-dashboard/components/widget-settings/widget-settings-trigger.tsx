/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { settings as settingsIcon } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardUIContext } from '../../context/ui-context';
import { getAdminMenuInset, getWidgetSettingsTitle } from './utils';
import type { DashboardWidget, WidgetType } from '../../types';

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
 * Per-instance gear that opens the shared settings drawer for its widget
 * by writing the instance `uuid` to the dashboard UI context. The single
 * `WidgetSettings` drawer at the root reacts to that change.
 *
 * Returns `null` when the type declares no attributes, so chrome can mount
 * it unconditionally.
 *
 * @param {WidgetSettingsTriggerProps} props            Component props.
 * @param {DashboardWidget}            props.widget     Instance to edit.
 * @param {WidgetType}                 props.widgetType Type backing it.
 * @return {React.ReactNode} The gear button, or `null`.
 */
export function WidgetSettingsTrigger( {
	widget,
	widgetType,
}: WidgetSettingsTriggerProps ): React.ReactNode {
	const {
		setSettingsWidgetUuid,
		setSettingsDrawerSide,
		setSettingsDrawerInset,
	} = useDashboardUIContext();

	const open = useCallback(
		( event: React.MouseEvent< HTMLElement > ) => {
			// Open the drawer on the side away from the widget so it stays
			// visible. Measure the widget's own box (the gear sits at its
			// corner, so using the gear would bias the result toward the
			// left), and weigh its center against the midpoint of the usable
			// content area — which starts after the admin menu, not at the
			// raw viewport edge. A widget past that midpoint opens a left
			// drawer, and vice versa.
			const adminMenuInset = getAdminMenuInset();
			const widgetBox = event.currentTarget.closest( 'section' );
			const rect = (
				widgetBox ?? event.currentTarget
			).getBoundingClientRect();
			const widgetCenter = rect.left + rect.width / 2;
			const contentCenter = ( adminMenuInset + window.innerWidth ) / 2;
			const side = widgetCenter > contentCenter ? 'left' : 'right';

			setSettingsDrawerSide( side );
			// A left drawer would otherwise slide over the fixed admin menu;
			// offset it by the menu width so it lands clear of it.
			setSettingsDrawerInset( side === 'left' ? adminMenuInset : 0 );
			setSettingsWidgetUuid( widget.uuid );
		},
		[
			setSettingsDrawerSide,
			setSettingsDrawerInset,
			setSettingsWidgetUuid,
			widget.uuid,
		]
	);

	if ( ! widgetType.attributes?.length ) {
		return null;
	}

	return (
		<IconButton
			icon={ settingsIcon }
			label={ getWidgetSettingsTitle( widgetType ) }
			variant="minimal"
			tone="neutral"
			size="compact"
			onClick={ open }
		/>
	);
}
