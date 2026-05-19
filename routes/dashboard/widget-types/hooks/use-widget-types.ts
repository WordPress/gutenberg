/**
 * WordPress dependencies
 */
import { dispatch, useRegistry, useSelect } from '@wordpress/data';
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
	classic_id?: string | null;
	title?: string | null;
}

type WidgetModuleRecordWithAliases = WidgetModuleRecord &
	Record< string, unknown >;

function getRecordString(
	record: WidgetModuleRecordWithAliases,
	snakeKey: keyof WidgetModuleRecord,
	camelKey: string
): string | null | undefined {
	const value = record[ snakeKey ] ?? record[ camelKey ];
	return typeof value === 'string' ? value : null;
}

/**
 * Returns the registered widget types, with each record's metadata
 * resolved from its `widget_module` script module.
 *
 * The list of records is read from the `widgetModule` core-data entity,
 * which fetches `/wp/v2/widget-modules` on first selector resolution.
 * For each record this hook dynamically imports `widget_module` and
 * merges the module's default export with the runtime fields (`name`,
 * `renderModule`). Until the imports resolve the hook returns an empty
 * array.
 *
 * Consumers do not register or dispatch anything; the data layer owns
 * caching and invalidation.
 */
export function useWidgetTypes(): WidgetType[] {
	const registry = useRegistry();

	const { records, hasResolved } = useSelect( ( select ) => {
		const query = {};
		const storeSelect = select( coreStore );
		return {
			records: storeSelect.getEntityRecords(
				'root',
				'widgetModule',
				query
			) as WidgetModuleRecord[] | null,
			hasResolved: storeSelect.hasFinishedResolution(
				'getEntityRecords',
				[ 'root', 'widgetModule', query ]
			),
		};
	}, [] );

	const [ widgetTypes, setWidgetTypes ] = useState< WidgetType[] >( [] );

	// Ensure the collection resolver runs (the entity is registered at module load).
	useEffect( () => {
		registry
			.resolveSelect( coreStore )
			.getEntityRecords( 'root', 'widgetModule' )
			.catch( () => {} );
	}, [ registry ] );

	useEffect( () => {
		if ( ! hasResolved || ! records ) {
			return;
		}

		let cancelled = false;

		Promise.all(
			records.map( async ( record ) => {
				const classicId = getRecordString(
					record,
					'classic_id',
					'classicId'
				);

				// Build artifact for the shared classic render module; not insertable.
				if (
					'wp-classic/classic-dashboard' === record.name &&
					! classicId
				) {
					return null;
				}

				if ( classicId ) {
					const renderModule = getRecordString(
						record,
						'render_module',
						'renderModule'
					);
					const widgetModule = getRecordString(
						record,
						'widget_module',
						'widgetModule'
					);
					const title = getRecordString( record, 'title', 'title' );
					const presentation = record.presentation;

					let icon: WidgetType[ 'icon' ];
					if ( widgetModule ) {
						try {
							const module = await import(
								/* webpackIgnore: true */ widgetModule
							);
							icon = ( module.default as Partial< WidgetType > )
								?.icon;
						} catch {
							// Fall through without a custom icon.
						}
					}

					return {
						apiVersion: 1,
						name: record.name as WidgetName,
						title: title ?? classicId,
						renderModule: renderModule ?? '',
						category: 'classic',
						...( presentation ? { presentation } : {} ),
						...( icon ? { icon } : {} ),
						example: {
							attributes: {
								classicId,
							},
						},
					} as WidgetType;
				}

				const widgetModule = getRecordString(
					record,
					'widget_module',
					'widgetModule'
				);

				if ( ! widgetModule ) {
					return null;
				}

				try {
					const module = await import(
						/* webpackIgnore: true */ widgetModule
					);

					if ( ! module?.default ) {
						return null;
					}

					const renderModule = getRecordString(
						record,
						'render_module',
						'renderModule'
					);
					const presentation = record.presentation;

					return {
						...( module.default as Partial< WidgetType > ),
						name: record.name as WidgetName,
						renderModule: renderModule ?? '',
						...( presentation ? { presentation } : {} ),
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
		} );

		return () => {
			cancelled = true;
		};
	}, [ hasResolved, records ] );

	return widgetTypes;
}
