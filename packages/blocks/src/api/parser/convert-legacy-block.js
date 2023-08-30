const LEGACY_BLOCK_TRANSFORMS = [
	/**
	 * Convert 'core/cover-image' block in existing content to 'core/cover'.
	 */
	{
		predicate: ( { blockName } ) => 'core/cover-image' === blockName,
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/cover',
		} ),
	},

	/**
	 * Convert 'core/text' blocks in existing content to 'core/paragraph'.
	 */
	{
		predicate: ( { blockName } ) =>
			'core/text' === blockName || 'core/cover-text' === blockName,
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/paragraph',
		} ),
	},

	/**
	 * Convert derivative blocks such as 'core/social-link-wordpress' to the
	 * canonical form 'core/social-link'.
	 */
	{
		predicate: ( { blockName } ) =>
			blockName && blockName.indexOf( 'core/social-link-' ) === 0,
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/social-link',
			attrs: {
				...rawBlock.attrs,
				// Capture `social-link-wordpress` into `{"service":"wordpress"}`
				service: rawBlock.blockName.substring( 17 ),
			},
		} ),
	},

	/**
	 * Convert derivative blocks such as 'core-embed/instagram' to the
	 * canonical form 'core/embed'.
	 */
	{
		predicate: ( { blockName } ) =>
			blockName && blockName.indexOf( 'core-embed/' ) === 0,
		convert: ( rawBlock ) => {
			const attrs = { ...attrs };

			// Capture `core-embed/instagram` into `{"providerNameSlug":"instagram"}`
			const providerSlug = rawBlock.blockName.substring( 11 );
			const deprecated = {
				speaker: 'speaker-deck',
				polldaddy: 'crowdsignal',
			};
			attrs.providerNameSlug =
				providerSlug in deprecated
					? deprecated[ providerSlug ]
					: providerSlug;

			// This is needed as the `responsive` attribute was passed
			// in a different way before the refactoring to block variations.
			if ( ! [ 'amazon-kindle', 'wordpress' ].includes( providerSlug ) ) {
				attrs.responsive = true;
			}

			return {
				...rawBlock,
				blockName: 'core/embed',
				attrs,
			};
		},
	},

	/**
	 * Convert 'core/post-comment-author' block in existing content to 'core/comment-author-name'.
	 */
	{
		predicate: ( { blockName } ) =>
			blockName === 'core/post-comment-author',
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/comment-author-name',
		} ),
	},

	/**
	 * Convert 'core/post-comment-content' block in existing content to 'core/comment-content'.
	 */
	{
		predicate: ( { blockName } ) =>
			blockName === 'core/post-comment-content',
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/comment-content',
		} ),
	},

	/**
	 * Convert 'core/post-comment-date' block in existing content to 'core/comment-date'.
	 */
	{
		predicate: ( { blockName } ) => blockName === 'core/post-comment-date',
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/comment-date',
		} ),
	},

	/**
	 * Convert 'core/comments-query-loop' block in existing content to 'core/comments'.
	 *
	 * Note that we also had to add a deprecation to the block in order
	 * for the ID change to work.
	 */
	{
		predicate: ( { blockName } ) =>
			blockName === 'core/comments-query-loop',
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/comments',
			attrs: {
				...rawBlock.attrs,
				className: rawBlock.attrs?.className.includes(
					'wp-block-comments-query-loop'
				)
					? rawBlock.attrs.className
					: [
							'wp-block-comments-query-loop',
							rawBlock.attrs.className,
					  ].join( ' ' ),
			},
		} ),
	},

	/**
	 * Convert 'core/post-comments' block in existing content to 'core/comments'.
	 */
	{
		predicate: ( { blockName } ) => blockName === 'core/post-comments',
		convert: ( rawBlock ) => ( {
			...rawBlock,
			blockName: 'core/comments',
			attrs: {
				...rawBlock.attrs,
				legacy: true,
			},
		} ),
	},
];

/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {string} blockName  The block's name
 * @param {Object} attrs      The block's attributes
 *
 * @return {[string, Object]} The block's name and attributes, changed accordingly if a match was found
 */
export function convertLegacyBlockNameAndAttributes( blockName, attrs ) {
	const { transform } =
		LEGACY_BLOCK_TRANSFORMS.find( ( { predicate } ) =>
			predicate( { blockName, attrs } )
		) || {};
	const newBlock = transform
		? transform( { blockName, attrs } )
		: { blockName, attrs };
	return [ newBlock.blockName, newBlock.attrs ];
}

/**
 * Like `convertLegacyBlockNameAndAttributes`, but for entire raw blocks.
 *
 * @param {Object} rawBlock Raw block object.
 * @returns {Object} Converted block object.
 */
export function convertLegacyBlock( rawBlock ) {
	return LEGACY_BLOCK_TRANSFORMS.find( ( { predicate } ) =>
		predicate( { blockName, attrs } )
	)?.convert( rawBlock );
}
