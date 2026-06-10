/**
 * WordPress dependencies
 */
import { dispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { WidgetName, WidgetType, WidgetTypeMetadata } from '../types';

/**
 * Registers the `widgetModule` core-data entity at module load.
 *
 * Scoped to this experimental feature: the entity lives here instead of
 * the static `rootEntitiesConfig` array, so WP installs that never load
 * the dashboard widgets package never see it.
 */
dispatch( coreStore ).addEntities( [
	{
		name: 'widgetModule',
		kind: 'root',
		key: 'name',
		baseURL: '/wp/v2/widget-modules',
		plural: 'widgetModules',
		label: __( 'Widget modules' ),
		supportsPagination: false,
	},
] );

/**
 * Shape returned by the `/wp/v2/widget-modules` REST endpoint. PHP keeps
 * snake_case (project convention); the camelCase mapping happens here at
 * the JS boundary.
 */
interface WidgetModuleRecord {
	name: string;
	render_module?: string | null;
	widget_module?: string | null;
	presentation?: WidgetTypeMetadata[ 'presentation' ] | null;
}

/**
 * `isResolvingWidgetTypes` is true while widget-module records or their
 * metadata imports have not finished resolving. Layout instances must not
 * be treated as missing until it is false.
 */
export type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/**
 * Returns the registered widget types, with each record's metadata
 * resolved from its `widget_module` script module.
 *
 * The list of records is read from the `widgetModule` core-data entity,
 * which fetches `/wp/v2/widget-modules` on first selector resolution.
 * For each record this hook dynamically imports `widget_module` and
 * merges the module's default export with the runtime fields (`name`,
 * `renderModule`).
 *
 * Consumers do not register or dispatch anything; the data layer owns
 * caching and invalidation.
 */
export function useWidgetTypes(): UseWidgetTypesResult {
	const records = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'root', 'widgetModule' ) as
				| WidgetModuleRecord[]
				| null,
		[]
	);

	const [ widgetTypes, setWidgetTypes ] = useState< WidgetType[] >( [] );
	const [ isResolvingWidgetTypes, setIsResolvingWidgetTypes ] =
		useState( true );

	useEffect( () => {
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
	}, [ records ] );

	return [ widgetTypes, isResolvingWidgetTypes ];
}
