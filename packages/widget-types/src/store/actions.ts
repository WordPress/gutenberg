import { applyFilters } from '@wordpress/hooks';
import warning from '@wordpress/warning';
import type { WidgetType } from '../types';

const WIDGET_NAME_REGEXP = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

export function registerWidgetType(
	name: string,
	settings: Partial< WidgetType >
) {
	if ( typeof name !== 'string' ) {
		warning( 'Widget type names must be strings.' );
		return;
	}

	if ( ! WIDGET_NAME_REGEXP.test( name ) ) {
		warning(
			'Widget type names must contain a namespace prefix, e.g. core/on-this-day'
		);
		return;
	}

	if ( ! settings.title ) {
		warning( 'The widget "' + name + '" must have a title.' );
		return;
	}

	if ( ! settings.render_module ) {
		warning( 'The widget "' + name + '" must have a render_module.' );
		return;
	}

	const widgetType = applyFilters(
		'widgets.registerWidgetType',
		{ ...settings, name },
		name
	) as WidgetType;

	return {
		type: 'ADD_WIDGET_TYPE' as const,
		widgetType,
	};
}

export function unregisterWidgetType( name: string ) {
	return {
		type: 'REMOVE_WIDGET_TYPE' as const,
		name,
	};
}
