import { applyFilters } from '@wordpress/hooks';
import warning from '@wordpress/warning';
import type { WidgetName, WidgetType } from '../types';

const WIDGET_NAME_REGEXP = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

/**
 * Register a widget type.
 *
 * Validates the name, required fields, and checks for duplicates
 * before applying the `widgets.registerWidgetType` filter and
 * dispatching the type to the store.
 *
 * @param {WidgetName}          name     Namespaced identifier, e.g. `core/on-this-day`.
 * @param {Partial<WidgetType>} settings Widget configuration.
 */
export const registerWidgetType =
	( name: WidgetName, settings: Partial< WidgetType > ) =>
	( {
		select,
		dispatch,
	}: {
		select: { getWidgetType: ( n: string ) => WidgetType | undefined };
		dispatch: ( action: {
			type: string;
			[ key: string ]: unknown;
		} ) => void;
	} ) => {
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

		if ( ! settings.renderModule ) {
			warning( 'The widget "' + name + '" must have a renderModule.' );
			return;
		}

		if ( select.getWidgetType( name ) ) {
			warning( 'Widget type "' + name + '" is already registered.' );
			return;
		}

		const widgetType = applyFilters(
			'widgets.registerWidgetType',
			{ ...settings, name },
			name
		) as WidgetType;

		dispatch( { type: 'ADD_WIDGET_TYPE', widgetType } );
	};

export function unregisterWidgetType( name: WidgetName ) {
	return {
		type: 'REMOVE_WIDGET_TYPE' as const,
		name,
	};
}
