/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from './utils/object';

type StyleTree = Record< string, any >;

interface GlobalStyles {
	settings?: StyleTree;
	styles?: StyleTree;
}

/**
 * Retrieves any block style variation styles data and resolves any referenced
 * values (`{ ref }` envelopes) against the supplied Global Styles tree.
 *
 * The returned object is a deep clone of the variation node with every `{ ref }`
 * envelope replaced by its resolved value; invalid or unresolvable refs are
 * dropped. The input `globalStyles` is never mutated.
 *
 * @param globalStyles A complete Global Styles object, containing `settings` and `styles`.
 * @param name         The name of the desired block type (e.g. `core/group`).
 * @param variation    The block style variation slug to retrieve data for.
 * @return The resolved Global Styles data for the specified variation, or `undefined`.
 */
export function getVariationStylesWithRefValues(
	globalStyles: GlobalStyles | null | undefined,
	name: string,
	variation: string
): StyleTree | undefined {
	if ( ! globalStyles?.styles?.blocks?.[ name ]?.variations?.[ variation ] ) {
		return undefined;
	}

	const replaceRefs = ( variationStyles: StyleTree ) => {
		Object.keys( variationStyles ).forEach( ( key ) => {
			const value = variationStyles[ key ];

			if ( typeof value === 'object' && value !== null ) {
				if ( value.ref !== undefined ) {
					if (
						typeof value.ref !== 'string' ||
						value.ref.trim() === ''
					) {
						delete variationStyles[ key ];
					} else {
						const refValue = getValueFromObjectPath(
							globalStyles,
							value.ref
						);

						if ( refValue !== undefined && refValue !== null ) {
							variationStyles[ key ] = refValue;
						} else {
							delete variationStyles[ key ];
						}
					}
				} else {
					replaceRefs( value );

					// After recursion, if value is empty due to explicitly
					// `undefined` ref value, remove it.
					if ( Object.keys( value ).length === 0 ) {
						delete variationStyles[ key ];
					}
				}
			}
		} );
	};

	// Deep clone variation node to avoid mutating it within global styles and losing refs.
	const styles = JSON.parse(
		JSON.stringify(
			globalStyles.styles.blocks[ name ].variations[ variation ]
		)
	);
	replaceRefs( styles );

	return styles;
}
