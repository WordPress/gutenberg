/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { store } from '../store';
import type { FieldCollection } from '../store/types';

/**
 * Hook to get field collections for a specific entity and merge their
 * non-serializable extensions into the serializable field definitions.
 *
 * The serializable field definitions come from the `core/field-collections`
 * store (fetched from `GET /wp/v2/field-collections`). Each script module a
 * collection lists in `fields_modules` is lazily imported and merged onto the
 * matching field by `id`. Modules merge in order, so a later module overrides
 * an earlier one property by property (last wins) — this is how a consumer
 * attaches behavior to a field it added, or overrides a default field's
 * behavior, via the `gutenberg_field_collection_modules` PHP filter.
 *
 * @param kind                  Entity kind (e.g., 'postType', 'taxonomy', 'user').
 * @param name                  Entity name (e.g., 'attachment', 'post', 'category').
 * @param options               Options for filtering fields.
 * @param options.allowedFields Optional list of field IDs to include.
 * @return Array of Field objects from field collections.
 */

export function useFieldCollections< T = any >(
	kind: string,
	name: string,
	options?: { allowedFields?: string[] }
): Field< T >[] {
	const fieldCollections = useSelect(
		( select ) => {
			const { getEntityFieldCollections } = select( store );
			return getEntityFieldCollections(
				kind,
				name
			) as FieldCollection< T >[];
		},
		[ kind, name ]
	);

	const [ loadedModules, setLoadedModules ] = useState<
		Record< string, Partial< Field< T > >[] >
	>( {} );

	const loadModulesForCollection = useEvent(
		async ( collection: FieldCollection< T > ) => {
			const handles = collection.fields_modules ?? [];

			const lists = await Promise.all(
				handles.map( async ( handle ) => {
					try {
						const module = await import(
							/* webpackIgnore: true */
							handle
						);
						return ( module.default || [] ) as Partial<
							Field< T >
						>[];
					} catch ( error ) {
						// eslint-disable-next-line no-console
						console.warn(
							`Could not load the "${ handle }" script module of the "${ collection.id }" field collection. Falling back to the serializable field definitions.`,
							error
						);
						return [];
					}
				} )
			);

			setLoadedModules( ( prev ) => ( {
				...prev,
				[ collection.id ]: lists.flat(),
			} ) );
		}
	);

	// Load script modules and merge extensions.
	useEffect( () => {
		if ( ! fieldCollections || fieldCollections.length === 0 ) {
			return;
		}

		for ( const collection of fieldCollections ) {
			void loadModulesForCollection( collection );
		}
	}, [ fieldCollections, loadModulesForCollection ] );

	const enhancedFields: Field< T >[] = useMemo( () => {
		if ( ! fieldCollections || fieldCollections.length === 0 ) {
			return [];
		}

		// Verify every current collection has a loaded module (not just count).
		// When switching entities, stale keys from the previous entity can make
		// the count match while new collections are still loading.
		const allLoaded = fieldCollections.every(
			( collection ) => collection.id in loadedModules
		);
		if ( ! allLoaded ) {
			return [];
		}

		return fieldCollections.flatMap( ( collection ) => {
			const extensions = loadedModules[ collection.id ];
			return collection.fields.map( ( field: Field< T > ) => {
				// Merge every extension matching this field id in order, so a
				// later module wins property by property over an earlier one.
				const matching = extensions.filter(
					( f ) => f.id === field.id
				);
				if ( matching.length === 0 ) {
					return field;
				}
				return Object.assign( {}, field, ...matching );
			} );
		} );
	}, [ fieldCollections, loadedModules ] );

	const allowedFields = options?.allowedFields;
	const filteredFields = useMemo( () => {
		if ( ! allowedFields || allowedFields.length === 0 ) {
			return enhancedFields;
		}
		return enhancedFields.filter( ( field ) =>
			allowedFields.includes( field.id )
		);
	}, [ enhancedFields, allowedFields ] );

	return filteredFields;
}
