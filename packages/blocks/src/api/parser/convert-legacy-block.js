/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {string|null} name       The block's name
 * @param {Object|null} attributes The block's attributes
 *
 * @return {[string, Object|null]} The block's name and attributes, changed accordingly if a match was found
 */
export function convertLegacyBlockNameAndAttributes( name, attributes ) {
	// Convert 'core/cover-image' block in existing content to 'core/cover'.
	if ( 'core/cover-image' === name ) {
		return [ 'core/cover', attributes ];
	}

	// Convert 'core/text' blocks in existing content to 'core/paragraph'.
	if ( 'core/text' === name || 'core/cover-text' === name ) {
		return [ 'core/paragraph', attributes ];
	}

	// Convert derivative blocks such as 'core/social-link-wordpress' to the
	// canonical form 'core/social-link'.
	if ( name && name.indexOf( 'core/social-link-' ) === 0 ) {
		// Capture `social-link-wordpress` into `{"service":"wordpress"}`
		const service = name.substring( 17 );
		return [ 'core/social-link', { ...attributes, service } ];
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

		const newAttributes = {};

		newAttributes.providerNameSlug =
			providerSlug in deprecated
				? deprecated[ providerSlug ]
				: providerSlug;

		// This is needed as the `responsive` attribute was passed
		// in a different way before the refactoring to block variations.
		if ( ! [ 'amazon-kindle', 'wordpress' ].includes( providerSlug ) ) {
			newAttributes.responsive = true;
		}

		return [ 'core/embed', { ...attributes, ...newAttributes } ];
	}

	// Convert Post Comment blocks in existing content to Comment blocks.
	// TODO: Remove these checks when WordPress 6.0 is released.
	if ( name === 'core/post-comment-author' ) {
		return [ 'core/comment-author-name', attributes ];
	}
	if ( name === 'core/post-comment-content' ) {
		return [ 'core/comment-content', attributes ];
	}
	if ( name === 'core/post-comment-date' ) {
		return [ 'core/comment-date', attributes ];
	}
	if ( name === 'core/comments-query-loop' ) {
		const { className = '' } = attributes;
		const needsClassName = ! className.includes(
			'wp-block-comments-query-loop'
		);
		const newAttributes = needsClassName
			? {
					...attributes,
					className: `wp-block-comments-query-loop ${ className }`,
			  }
			: attributes;

		// Note that we also had to add a deprecation to the block in order
		// for the ID change to work.
		return [ 'core/comments', newAttributes ];
	}
	if ( name === 'core/post-comments' ) {
		return [ 'core/comments', { ...attributes, legacy: true } ];
	}

	return [ name, attributes ];
}
