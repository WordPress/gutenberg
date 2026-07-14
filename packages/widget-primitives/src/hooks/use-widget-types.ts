/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { resolveFields } from '../field-types';
import type { WidgetModuleRecord, WidgetName, WidgetType } from '../types';

/* `true` while records or their metadata imports are still resolving; hosts
   must not treat a widget instance as missing until it is `false`. */
type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/**
 * Resolves widget types from host-supplied records.
 *
 * For each record it dynamically imports `widget_module` and merges the
 * module's default export with the runtime fields (`name`, `renderModule`).
 * Attribute schemas pass through `resolveFields`, so attributes referencing
 * registered field types reach hosts as plain DataViews fields.
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

					const metadata = module.default as Partial< WidgetType >;

					return {
						...metadata,
						...( metadata.attributes
							? {
									attributes: resolveFields(
										metadata.attributes
									),
							  }
							: {} ),
						name: record.name as WidgetName,
						renderModule: record.render_module ?? '',
						/*
						 * `title` is required:
						 * - Server-side title wins
						 * - Then the module's title
						 * - Then the record's name as fallback
						 */
						title: record.title ?? metadata.title ?? record.name,
						...( record.presentation
							? { presentation: record.presentation }
							: {} ),
						...( record.category
							? { category: record.category }
							: {} ),
						...( record.description
							? { description: record.description }
							: {} ),
						...( record.help ? { help: record.help } : {} ),
						...( record.keywords
							? { keywords: record.keywords }
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
