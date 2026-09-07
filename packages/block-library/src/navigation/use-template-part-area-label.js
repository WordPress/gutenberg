import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { unlock } from '../lock-unlock';

/**
 * Returns the label of the template part area a navigation block sits in,
 * looking at its parent pattern instances (`core/block`): the instance's own
 * `area` attribute, else the area of the registered pattern it references.
 *
 * @param {string} clientId The navigation block's client id.
 * @return {string|undefined} The area label, e.g. "Header".
 */
export default function useTemplatePartAreaLabel( clientId ) {
	return useSelect(
		( select ) => {
			// Use the lack of a clientId as an opportunity to bypass the rest
			// of this hook.
			if ( ! clientId ) {
				return;
			}

			const { getBlock, getBlockParentsByBlockName } =
				select( blockEditorStore );

			const withAscendingResults = true;
			const parentPatternClientIds = getBlockParentsByBlockName(
				clientId,
				'core/block',
				withAscendingResults
			);

			if ( ! parentPatternClientIds?.length ) {
				return;
			}

			const { getPatternBySlug } = unlock( select( blockEditorStore ) );
			for ( const patternClientId of parentPatternClientIds ) {
				const { area: areaAttribute, slug } =
					getBlock( patternClientId ).attributes;
				const area =
					areaAttribute ||
					( slug ? getPatternBySlug( slug )?.area : undefined );

				// Look up the `label` for the area in the defined areas so
				// that an internationalized label can be used.
				if ( area && area !== 'uncategorized' ) {
					const definedAreas =
						select( coreStore ).getCurrentTheme()
							?.default_template_part_areas || [];
					return definedAreas.find(
						( definedArea ) => definedArea.area === area
					)?.label;
				}
			}
		},
		[ clientId ]
	);
}
