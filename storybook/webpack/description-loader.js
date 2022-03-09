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

/**
 * External dependencies
 */
const babel = require( '@babel/core' );

function createDescriptionNode( name, description ) {
	return babel.types.expressionStatement(
		babel.types.assignmentExpression(
			'=',
			babel.types.memberExpression(
				babel.types.identifier( name ),
				babel.types.identifier( 'story' )
			),
			babel.types.objectExpression( [
				babel.types.objectProperty(
					babel.types.identifier( 'parameters' ),
					babel.types.objectExpression( [
						babel.types.objectProperty(
							babel.types.identifier( 'docs' ),
							babel.types.objectExpression( [
								babel.types.objectProperty(
									babel.types.identifier(
										'storyDescription'
									),
									babel.types.stringLiteral( description )
								),
							] )
						),
					] )
				),
			] )
		)
	);
}

function annotateDescriptionPlugin() {
	return {
		visitor: {
			ExportNamedDeclaration( path ) {
				if ( path.node.leadingComments ) {
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
					const declaration = path.node.declaration.declarations[ 0 ];

					path.insertAfter(
						createDescriptionNode(
							declaration.id.name,
							description
						)
					);
				}
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
