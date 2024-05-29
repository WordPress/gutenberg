/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';

export const useIsDirty = () => {
	const { editedEntities, siteEdits, siteEntityConfig } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				getEntityRecordEdits,
				getEntityConfig,
			} = select( coreStore );

			return {
				editedEntities: __experimentalGetDirtyEntityRecords(),
				siteEdits: getEntityRecordEdits( 'root', 'site' ),
				siteEntityConfig: getEntityConfig( 'root', 'site' ),
			};
		},
		[]
	);

	const dirtyEntityRecords = useMemo( () => {
		// Remove site object and decouple into its edited pieces.
		const editedEntitiesWithoutSite = editedEntities.filter(
			( record ) => ! ( record.kind === 'root' && record.name === 'site' )
		);

		const siteEntityLabels = siteEntityConfig?.meta?.labels ?? {};
		const editedSiteEntities = [];
		for ( const property in siteEdits ) {
			editedSiteEntities.push( {
				kind: 'root',
				name: 'site',
				title: siteEntityLabels[ property ] || property,
				property,
			} );
		}

		return [ ...editedEntitiesWithoutSite, ...editedSiteEntities ];
	}, [ editedEntities, siteEdits, siteEntityConfig ] );

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = (
		{ kind, name, key, property },
		checked
	) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key ||
						elt.property !== property
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key, property },
			] );
		}
	};

	const isDirty = dirtyEntityRecords.length - unselectedEntities.length > 0;

	return {
		dirtyEntityRecords,
		isDirty,
		setUnselectedEntities,
		unselectedEntities,
	};
};
