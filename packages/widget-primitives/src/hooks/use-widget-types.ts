/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	UseWidgetTypesOptions,
	WidgetName,
	WidgetType,
	WidgetTypeMetadata,
} from '../types';

/**
 * Shape returned by a widget-modules REST endpoint. PHP keeps snake_case
 * (project convention); the camelCase mapping happens here at the JS
 * boundary.
 */
interface WidgetModuleRecord {
	name: string;
	render_module?: string | null;
	widget_module?: string | null;
	presentation?: WidgetTypeMetadata[ 'presentation' ] | null;
}

/**
 * `isResolvingWidgetTypes` is true while widget-module records or their
 * metadata imports have not finished resolving. Hosts must not treat a
 * widget instance as missing until it is false.
 */
type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/**
 * Returns the registered widget types, with each record's metadata
 * resolved from its `widget_module` script module.
 *
 * The records are read from the core-data entity identified by
 * ( `kind`, `name` ). The host registers that entity, with its own
 * `baseURL`, before rendering, so discovery is not bound to a single
 * endpoint. When no entity is registered for that pair, the hook resolves
 * to an empty list. For each record this hook dynamically imports
 * `widget_module` and merges the module's default export with the runtime
 * fields (`name`, `renderModule`).
 *
 * Consumers do not register or dispatch anything; the data layer owns
 * caching and invalidation.
 *
 * @param {UseWidgetTypesOptions} Coordinates of the widget-modules entity to read.
 */
export function useWidgetTypes( {
	kind,
	name,
}: UseWidgetTypesOptions ): UseWidgetTypesResult {
	const records = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( kind, name ) as
				| WidgetModuleRecord[]
				| null,
		[ kind, name ]
	);

	/* Whether the host registered the ( kind, name ) entity. Without it
	   there is nothing to resolve, so the hook degrades to an empty list
	   rather than waiting on records that never arrive. */
	const hasEntity = useSelect(
		( select ) => !! select( coreStore ).getEntityConfig( kind, name ),
		[ kind, name ]
	);

	const [ widgetTypes, setWidgetTypes ] = useState< WidgetType[] >( [] );
	const [ isResolvingWidgetTypes, setIsResolvingWidgetTypes ] =
		useState( true );

	useEffect( () => {
		if ( ! hasEntity ) {
			setWidgetTypes( [] );
			setIsResolvingWidgetTypes( false );
			return;
		}

		if ( records === null ) {
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
	}, [ hasEntity, records ] );

	return [ widgetTypes, isResolvingWidgetTypes ];
}
