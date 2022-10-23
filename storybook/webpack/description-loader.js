/**
 * External dependencies
 */
const babel = require( '@babel/core' );

/**
 * Allows a story description to be written as a doc comment above the exported story.
 *
 * Based on https://github.com/izhan/storybook-description-loader
 *
 * @example
 * ```jsx
 * // This comment will become the description for the story in the generated docs.
 * export const MyStory = Template.bind({});
 * ```
 */
function annotateDescriptionPlugin() {
	return {
		visitor: {
			ExportNamedDeclaration( path ) {
				if ( ! path.node.leadingComments ) {
					return;
				}

				const commentValues = path.node.leadingComments.map(
					( node ) => {
						if ( node.type === 'CommentLine' ) {
							return node.value.trimLeft();
						}
						// else, node.type === 'CommentBlock'
						return node.value
							.split( '\n' )
							.map( ( line ) => {
								// stripping out the whitespace and * from comment blocks
								return line.replace(
									/^(\s+)?(\*+)?(\s+)?/,
									''
								);
							} )
							.join( '\n' )
							.trim();
					}
				);
				const description = commentValues.join( '\n' );
				const storyId = path.node.declaration.declarations[ 0 ].id.name;

				path.container.push(
					...babel.template.ast`
							${ storyId }.parameters ??= {};
							${ storyId }.parameters.docs ??= {};
							${ storyId }.parameters.docs.description ??= {};
							${ storyId }.parameters.docs.description.story ??= ${ JSON.stringify(
						description
					) };
					`
				);
			},
		},
	};
}

module.exports = function ( source ) {
	const output = babel.transform( source, {
		plugins: [ annotateDescriptionPlugin ],
		filename: __filename,
		sourceType: 'module',
	} );
	return output.code;
};
