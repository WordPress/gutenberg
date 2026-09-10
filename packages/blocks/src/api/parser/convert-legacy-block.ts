/* eslint-disable @wordpress/wp-global-usage */
declare global {
	var IS_GUTENBERG_PLUGIN: boolean | undefined;
}
/* eslint-enable @wordpress/wp-global-usage */

/**
 * Normalizes legacy style state keys in serialized block attributes.
 *
 * Gutenberg plugin back compat for content saved before viewport style states
 * used `@mobile` / `@tablet`. Guarded by `IS_GUTENBERG_PLUGIN` so synced
 * Core package code does not apply it.
 *
 * @param style Block style attribute.
 * @return Style attribute with canonical state keys.
 */
export function normalizeStyleStateAliases( style: unknown ): unknown {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return style;
	}

	if ( ! style || typeof style !== 'object' || Array.isArray( style ) ) {
		return style;
	}

	let normalizedStyle = style as Record< string, unknown >;
	const viewportAliases: Record< string, string > = {
		'@mobile': 'mobile',
		'@tablet': 'tablet',
	};

	Object.entries( viewportAliases ).forEach( ( [ state, legacyState ] ) => {
		if ( ! Object.hasOwn( normalizedStyle, legacyState ) ) {
			return;
		}

		if ( normalizedStyle === style ) {
			normalizedStyle = { ...normalizedStyle };
		}
		if ( ! Object.hasOwn( normalizedStyle, state ) ) {
			normalizedStyle[ state ] = normalizedStyle[ legacyState ];
		}
		delete normalizedStyle[ legacyState ];
	} );

	return normalizedStyle;
}

/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param name       The block's name
 * @param attributes The block's attributes
 *
 * @return The block's name and attributes, changed accordingly if a match was found
 */
export function convertLegacyBlockNameAndAttributes(
	name: string | undefined | null,
	attributes: Record< string, unknown >
): [ string | undefined | null, Record< string, unknown > ] {
	const newAttributes = { ...attributes };
	// Convert 'core/cover-image' block in existing content to 'core/cover'.
	if ( 'core/cover-image' === name ) {
		name = 'core/cover';
	}

	// Convert 'core/text' blocks in existing content to 'core/paragraph'.
	if ( 'core/text' === name || 'core/cover-text' === name ) {
		name = 'core/paragraph';
	}

	// Convert derivative blocks such as 'core/social-link-wordpress' to the
	// canonical form 'core/social-link'.
	if ( name && name.indexOf( 'core/social-link-' ) === 0 ) {
		// Capture `social-link-wordpress` into `{"service":"wordpress"}`
		newAttributes.service = name.substring( 17 );
		name = 'core/social-link';
	}

	// Convert derivative blocks such as 'core-embed/instagram' to the
	// canonical form 'core/embed'.
	if ( name && name.indexOf( 'core-embed/' ) === 0 ) {
		// Capture `core-embed/instagram` into `{"providerNameSlug":"instagram"}`
		const providerSlug = name.substring( 11 );
		const deprecated: Record< string, string > = {
			speaker: 'speaker-deck',
			polldaddy: 'crowdsignal',
		};
		newAttributes.providerNameSlug =
			providerSlug in deprecated
				? deprecated[ providerSlug ]
				: providerSlug;
		// This is needed as the `responsive` attribute was passed
		// in a different way before the refactoring to block variations.
		if ( ! [ 'amazon-kindle', 'wordpress' ].includes( providerSlug ) ) {
			newAttributes.responsive = true;
		}
		name = 'core/embed';
	}

	// Convert Post Comment blocks in existing content to Comment blocks.
	if ( name === 'core/post-comment-author' ) {
		name = 'core/comment-author-name';
	}
	if ( name === 'core/post-comment-content' ) {
		name = 'core/comment-content';
	}
	if ( name === 'core/post-comment-date' ) {
		name = 'core/comment-date';
	}
	if ( name === 'core/comments-query-loop' ) {
		name = 'core/comments';
		const className = ( newAttributes.className ?? '' ) as string;
		if ( ! className.includes( 'wp-block-comments-query-loop' ) ) {
			newAttributes.className = [
				'wp-block-comments-query-loop',
				className,
			].join( ' ' );
		}
		// Note that we also had to add a deprecation to the block in order
		// for the ID change to work.
	}
	if ( name === 'core/post-comments' ) {
		name = 'core/comments';
		newAttributes.legacy = true;
	}

	// Column count was stored as a string from WP 6.3-6.6. Convert it to a number.
	const layout = attributes.layout as Record< string, unknown > | undefined;
	if ( layout?.type === 'grid' && typeof layout?.columnCount === 'string' ) {
		newAttributes.layout = {
			...( newAttributes.layout as Record< string, unknown > ),
			columnCount: parseInt( layout.columnCount, 10 ),
		};
	}

	// Column span and row span were stored as strings in WP 6.6. Convert them to numbers.
	const style = attributes.style as Record< string, unknown > | undefined;
	const styleLayout = style?.layout as Record< string, unknown > | undefined;
	if ( typeof styleLayout?.columnSpan === 'string' ) {
		const columnSpanNumber = parseInt( styleLayout.columnSpan, 10 );
		newAttributes.style = {
			...( newAttributes.style as Record< string, unknown > ),
			layout: {
				...( ( newAttributes.style as Record< string, unknown > )
					?.layout as Record< string, unknown > ),
				columnSpan: isNaN( columnSpanNumber )
					? undefined
					: columnSpanNumber,
			},
		};
	}
	if ( typeof styleLayout?.rowSpan === 'string' ) {
		const rowSpanNumber = parseInt( styleLayout.rowSpan, 10 );
		newAttributes.style = {
			...( newAttributes.style as Record< string, unknown > ),
			layout: {
				...( ( newAttributes.style as Record< string, unknown > )
					?.layout as Record< string, unknown > ),
				rowSpan: isNaN( rowSpanNumber ) ? undefined : rowSpanNumber,
			},
		};
	}

	// `normalizeStyleStateAliases` will return the same value when there are no
	// aliases to resolve. Use an equality check to decide whether to update the
	// property. The `if` statement also guards against `style` being set as an
	// undefined property.
	const normalizedStyle = normalizeStyleStateAliases( newAttributes.style );
	if ( normalizedStyle !== newAttributes.style ) {
		newAttributes.style = normalizedStyle;
	}

	return [ name, newAttributes ];
}
