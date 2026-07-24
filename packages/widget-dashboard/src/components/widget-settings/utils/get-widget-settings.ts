/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Localized "<Widget> settings" label, falling back to a generic title
 * when the type declares none.
 *
 * @param {WidgetType} widgetType Type backing the open instance.
 * @return {string} The drawer/trigger title.
 */
export function getWidgetSettingsTitle( widgetType?: WidgetType ): string {
	return widgetType?.title
		? sprintf(
				/* translators: %s: Widget title. */
				__( '%s settings' ),
				widgetType.title
		  )
		: __( 'Widget settings' );
}
