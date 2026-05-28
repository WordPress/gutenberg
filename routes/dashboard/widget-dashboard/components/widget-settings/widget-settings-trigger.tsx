/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardUIContext } from '../../context/ui-context';
import { getAdminMenuInset } from './utils';
import type { DashboardWidget } from '../../types';
import type { WidgetType } from '../../../widget-primitives';

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
			// Open the drawer on the side away from the widget: compare the
			// tile's center against the midpoint of the usable content area
			// (which starts after the admin menu). Past it opens left.
			const adminMenuInset = getAdminMenuInset();
			// The gear sits in the grid slot, outside the card, so reach the
			// tile via the grid item's data hook.
			const tile = event.currentTarget.closest(
				'[data-wp-grid-item-key]'
			);
			const rect = (
				tile ?? event.currentTarget
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
			icon={ cog }
			label={ __( 'Widget settings' ) }
			variant="minimal"
			tone="neutral"
			size="compact"
			onClick={ open }
		/>
	);
}
