/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WidgetModuleRecord, WidgetName, WidgetType } from '../types';

/* `true` while records or their metadata imports are still resolving; hosts
   must not treat a widget instance as missing until it is `false`. */
type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/**
 * Resolves widget types from host-supplied records.
 *
 * For each record it dynamically imports `widget_module` and merges the
 * module's default export with the runtime fields (`name`, `renderModule`).
 * Pass `null`/`undefined` while records are still loading.
 *
 * @param records Host-supplied records, or `null`/`undefined` while loading.
 */
export function useWidgetTypes(
	records: WidgetModuleRecord[] | null | undefined
): UseWidgetTypesResult {
	const [ widgetTypes, setWidgetTypes ] = useState< WidgetType[] >( [] );
	const [ isResolvingWidgetTypes, setIsResolvingWidgetTypes ] =
		useState( true );

	useEffect( () => {
		if ( records === null || records === undefined ) {
			setIsResolvingWidgetTypes( true );
			return;
		}

		if ( records.length === 0 ) {
			setWidgetTypes( [] );
			setIsResolvingWidgetTypes( false );
			return;
		}

		let cancelled = false;
		setIsResolvingWidgetTypes( true );

		Promise.all(
			records.map( async ( record ) => {
				if ( ! record.widget_module ) {
					return null;
				}

				try {
					const module = await import(
						/* webpackIgnore: true */ record.widget_module
					);

					if ( ! module?.default ) {
						return null;
					}

					return {
						...( module.default as Partial< WidgetType > ),
						name: record.name as WidgetName,
						renderModule: record.render_module ?? '',
						...( record.presentation
							? { presentation: record.presentation }
							: {} ),
						...( record.category
							? { category: record.category }
							: {} ),
					} as WidgetType;
				} catch {
					return null;
				}
			} )
		).then( ( results ) => {
			if ( cancelled ) {
				return;
			}

			setWidgetTypes(
				results.filter( ( t ): t is WidgetType => t !== null )
			);
			setIsResolvingWidgetTypes( false );
		} );

		return () => {
			cancelled = true;
		};
	}, [ records ] );

	return [ widgetTypes, isResolvingWidgetTypes ];
}
