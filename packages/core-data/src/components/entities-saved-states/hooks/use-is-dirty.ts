import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { STORE_NAME } from '../../../name';
import type { store as coreStore } from '../../../';
import type {
	EntitySavedStatesRecord,
	IsDirtyState,
	SetUnselectedEntities,
} from '../types';

/**
 * Custom hook that determines if any entities are dirty (edited) and provides a way to manage selected/unselected entities.
 *
 * @return An object containing the following properties:
 *   - dirtyEntityRecords: An array of dirty entity records.
 *   - isDirty: A boolean indicating if there are any dirty entity records.
 *   - setUnselectedEntities: A function to set the unselected entities.
 *   - unselectedEntities: An array of unselected entities.
 */
export const useIsDirty = (): IsDirtyState => {
	const { editedEntities, siteEdits, siteEntityConfig } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				getEntityRecordEdits,
				getEntityConfig,
				// The store is selected by name, which carries no store types.
			} = select( STORE_NAME as unknown as typeof coreStore );

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
		const {
			title: siteTitleEdit,
			description: siteDescriptionEdit,
			site_logo: siteLogoEdit,
			site_icon: siteIconEdit,
			...otherSiteEdits
		} = siteEdits ?? {};
		const orderedSiteProperties = [
			siteTitleEdit !== undefined && 'title',
			siteDescriptionEdit !== undefined && 'description',
			siteLogoEdit !== undefined && 'site_logo',
			siteIconEdit !== undefined && 'site_icon',
			...Object.keys( otherSiteEdits ),
			// `Boolean` drops the properties without an edit.
		].filter( Boolean ) as Array< string >;
		const editedSiteEntities = orderedSiteProperties.map(
			( property ) => ( {
				kind: 'root',
				name: 'site',
				title: siteEntityLabels[ property ] || property,
				property,
			} )
		);

		return [ ...editedEntitiesWithoutSite, ...editedSiteEntities ];
	}, [ editedEntities, siteEdits, siteEntityConfig ] );

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState<
		Array< EntitySavedStatesRecord >
	>( [] );

	const setUnselectedEntities: SetUnselectedEntities = (
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
