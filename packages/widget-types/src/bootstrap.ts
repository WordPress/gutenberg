/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from './store';
import type { WidgetType } from './types';

interface RegisteredEntry {
	name: string;
	render_module?: string;
	widget_module?: string;
}

declare global {
	interface Window {
		__registeredWidgetTypes?: RegisteredEntry[];
	}
}

export async function bootstrapWidgetTypes(): Promise< void > {
	const registered = window.__registeredWidgetTypes ?? [];

	const results = await Promise.all(
		registered.map( async ( entry ) => {
			try {
				if ( ! entry.widget_module ) {
					return null;
				}

				const module = await import(
					/* webpackIgnore: true */ entry.widget_module
				);

				if ( ! module?.default ) {
					return null;
				}

				return {
					...( module.default as Partial< WidgetType > ),
					name: entry.name,
					render_module: entry.render_module ?? '',
				};
			} catch {
				return null;
			}
		} )
	);

	const { registerWidgetType } = dispatch( store );

	for ( const widgetType of results ) {
		if ( widgetType?.name ) {
			registerWidgetType( widgetType.name, widgetType );
		}
	}
}
