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
 * store (fetched from `GET /wp/v2/field-collections`). Each collection that
 * declares a `fields_module` has its script module lazily imported and merged
 * onto the matching field by `id`.
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

	const loadModuleForCollection = useEvent(
		async ( collection: FieldCollection< T > ) => {
			if ( ! collection.fields_module ) {
				setLoadedModules( ( prev ) => ( {
					...prev,
					[ collection.id ]: [],
				} ) );
				return;
			}

			let extensions: Partial< Field< T > >[] = [];
			try {
				const module = await import(
					/* webpackIgnore: true */
					collection.fields_module
				);
				extensions = module.default || [];
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Could not load the "${ collection.fields_module }" script module of the "${ collection.id }" field collection. Falling back to the serializable field definitions.`,
					error
				);
			}

			setLoadedModules( ( prev ) => ( {
				...prev,
				[ collection.id ]: extensions,
			} ) );
		}
	);

	// Load script modules and merge extensions.
	useEffect( () => {
		if ( ! fieldCollections || fieldCollections.length === 0 ) {
			return;
		}

		for ( const collection of fieldCollections ) {
			void loadModuleForCollection( collection );
		}
	}, [ fieldCollections, loadModuleForCollection ] );

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
				const extensionField = extensions.find(
					( f ) => f.id === field.id
				);
				if ( extensionField ) {
					return {
						...field,
						...extensionField,
					};
				}
				return field;
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
