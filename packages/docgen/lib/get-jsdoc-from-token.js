/**
 * External dependencies
 */
const commentParser = require( 'comment-parser' );

/**
 * Internal dependencies
 */
const getLeadingComments = require( './get-leading-comments' );
const getTypeAnnotation = require( './get-type-annotation' );

/**
 * Function that takes an Espree token and returns
 * a object representing the leading JSDoc comment of the token,
 * if any.
 *
 * @param {Object} token                 Espree token to extract the leading JSDoc comment from.
 * @param {Object} [typeAnnotationToken] Espree token to use for type inference. Defaults to `token`.
 *                                       Pass the function implementation node when the JSDoc lives on
 *                                       an overload signature so that inferred types reflect the
 *                                       implementation's parameter/return types.
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = ( token, typeAnnotationToken = token ) => {
	let jsdoc;
	const comments = getLeadingComments( token );
	if ( comments && /^\*\r?\n/.test( comments ) ) {
		jsdoc = commentParser.parse( `/*${ comments }*/`, {
			spacing: 'preserve',
		} )[ 0 ];
		if ( jsdoc ) {
			let paramCount = 0;

			jsdoc.tags = jsdoc.tags.map( ( tag ) => {
				const isParam = tag.tag === 'param';
				const isUnqualifiedParam =
					isParam && ! tag.name.includes( '.' );
				let index = isUnqualifiedParam ? paramCount++ : paramCount;

				// Qualified parameters come after an unqualified parameter. When
				// the paramCount is incremented for an unqualified parameter, we
				// still need to access that previous index. In other words, the
				// qualified parameter types exist at the index of the previous
				// unqualified parameter. As a result, the index is actually less.
				if ( isParam && index > 0 && ! isUnqualifiedParam ) {
					index -= 1;
				}

				return {
					...tag,
					type: getTypeAnnotation( tag, typeAnnotationToken, index ),
					description:
						tag.description === '\n'
							? tag.description.trim()
							: tag.description,
				};
			} );

			if ( jsdoc.tags.length === 0 ) {
				const potentialTypeAnnotation = getTypeAnnotation(
					{ tag: 'type' },
					typeAnnotationToken,
					0
				);
				if ( potentialTypeAnnotation ) {
					jsdoc.tags.push( {
						tag: 'type',
						type: potentialTypeAnnotation,
						name: '',
						description: '',
					} );
				}
			}
		}
	}
	return jsdoc;
};
