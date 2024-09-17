/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {string} name       The block's name
 * @param {Object} attributes The block's attributes
 *
 * @return {[string, Object]} The block's name and attributes, changed accordingly if a match was found
 */
export function convertLegacyBlockNameAndAttributes( name, attributes ) {
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
		const deprecated = {
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
	// TODO: Remove these checks when WordPress 6.0 is released.
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
		const { className = '' } = newAttributes;
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
	if (
		attributes.layout?.type === 'grid' &&
		typeof attributes.layout?.columnCount === 'string'
	) {
		newAttributes.layout = {
			...newAttributes.layout,
			columnCount: parseInt( attributes.layout.columnCount, 10 ),
		};
	}

	// Column span and row span were stored as strings in WP 6.6. Convert them to numbers.
	if ( typeof attributes.style?.layout?.columnSpan === 'string' ) {
		const columnSpanNumber = parseInt(
			attributes.style.layout.columnSpan,
			10
		);
		newAttributes.style = {
			...newAttributes.style,
			layout: {
				...newAttributes.style.layout,
				columnSpan: isNaN( columnSpanNumber )
					? undefined
					: columnSpanNumber,
			},
		};
	}
	if ( typeof attributes.style?.layout?.rowSpan === 'string' ) {
		const rowSpanNumber = parseInt( attributes.style.layout.rowSpan, 10 );
		newAttributes.style = {
			...newAttributes.style,
			layout: {
				...newAttributes.style.layout,
				rowSpan: isNaN( rowSpanNumber ) ? undefined : rowSpanNumber,
			},
		};
	}

	// The following code is only relevant for the Gutenberg plugin.
	// It's a stand-alone if statement for dead-code elimination.
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		// Convert pattern overrides added during experimental phase.
		// Only four blocks were supported initially.
		// These checks can be removed in WordPress 6.6.
		if (
			newAttributes.metadata?.bindings &&
			( name === 'core/paragraph' ||
				name === 'core/heading' ||
				name === 'core/image' ||
				name === 'core/button' ) &&
			newAttributes.metadata.bindings.__default?.source !==
				'core/pattern-overrides'
		) {
			const bindings = [
				'content',
				'url',
				'title',
				'id',
				'alt',
				'text',
				'linkTarget',
			];
			// Delete any existing individual bindings and add a default binding.
			// It was only possible to add all the default attributes through the UI,
			// So as soon as we find an attribute, we can assume all default attributes are overridable.
			let hasPatternOverrides = false;
			bindings.forEach( ( binding ) => {
				if (
					newAttributes.metadata.bindings[ binding ]?.source ===
					'core/pattern-overrides'
				) {
					hasPatternOverrides = true;
					newAttributes.metadata = {
						...newAttributes.metadata,
						bindings: { ...newAttributes.metadata.bindings },
					};
					delete newAttributes.metadata.bindings[ binding ];
				}
			} );
			if ( hasPatternOverrides ) {
				newAttributes.metadata.bindings.__default = {
					source: 'core/pattern-overrides',
				};
			}
		}
	}
	return [ name, newAttributes ];
}
