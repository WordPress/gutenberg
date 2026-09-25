import { getValueFromObjectPath } from './utils/object';

type StyleTree = Record< string, any >;

interface GlobalStyles {
	settings?: StyleTree;
	styles?: StyleTree;
}

interface GetVariationStyleOptions {
	resolveRefs?: boolean;
}

/**
 * Retrieves a block style variation's styles from the Global Styles tree.
 *
 * The result is always a deep clone, so callers can mutate it and the input is
 * left untouched. By default, a `{ ref }` value (a reference that points at
 * another value in the tree, e.g. `{ ref: 'styles.color.background' }`) is
 * replaced with the value it points at, and any invalid or missing reference is
 * dropped. Pass `resolveRefs: false` to leave those references in place.
 *
 * @param globalStyles        A complete Global Styles object, containing `settings` and `styles`.
 * @param name                The block type name (e.g. `core/group`).
 * @param variation           The block style variation slug to retrieve.
 * @param options             Optional settings.
 * @param options.resolveRefs Whether to replace a `{ ref }` value with the value it points at. Defaults to `true`.
 * @return The variation's styles, or `undefined` when the variation is not present.
 */
export function getVariationStyle(
	globalStyles: GlobalStyles | null | undefined,
	name: string,
	variation: string,
	{ resolveRefs = true }: GetVariationStyleOptions = {}
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
	if ( resolveRefs ) {
		replaceRefs( styles );
	}

	return styles;
}
