import { applyFilters } from '@wordpress/hooks';
import warning from '@wordpress/warning';
import type { WidgetName, WidgetType } from '../types';

const WIDGET_NAME_REGEXP = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

const DEFAULT_WIDGET_TYPE_SETTINGS: Partial< WidgetType > = {
	apiVersion: 1,
	keywords: [],
	attributes: [],
};

/**
 * Register a widget type.
 *
 * Validates the name, required fields, value shapes, and duplicates
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

		if ( typeof settings.title !== 'string' ) {
			warning( 'Widget type titles must be strings.' );
			return;
		}

		if (
			settings.description !== undefined &&
			typeof settings.description !== 'string'
		) {
			warning( 'Widget type descriptions must be strings.' );
			return;
		}

		if (
			settings.attributes !== undefined &&
			! Array.isArray( settings.attributes )
		) {
			warning( 'Widget type attributes must be an array.' );
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
			{ ...DEFAULT_WIDGET_TYPE_SETTINGS, ...settings, name },
			name
		) as WidgetType;

		dispatch( { type: 'ADD_WIDGET_TYPE', widgetType } );
	};

/**
 * Unregister a widget type.
 *
 * Warns and returns `undefined` if the widget type is not registered.
 * Otherwise removes it from the store and returns the removed widget
 * type.
 *
 * @param {WidgetName} name Widget type name to remove.
 */
export const unregisterWidgetType =
	( name: WidgetName ) =>
	( {
		select,
		dispatch,
	}: {
		select: { getWidgetType: ( n: string ) => WidgetType | undefined };
		dispatch: ( action: {
			type: string;
			[ key: string ]: unknown;
		} ) => void;
	} ): WidgetType | undefined => {
		const oldWidgetType = select.getWidgetType( name );

		if ( ! oldWidgetType ) {
			warning( 'Widget type "' + name + '" is not registered.' );
			return undefined;
		}

		dispatch( { type: 'REMOVE_WIDGET_TYPE', name } );

		return oldWidgetType;
	};
