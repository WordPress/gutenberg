/**
 * External dependencies
 */
const babel = require( '@babel/core' );

/**
 * Reads `tags` from the story metadata and copies them to `badges`.
 *
 * @see https://github.com/geometricpanda/storybook-addon-badges
 * @see '../badges.js' - Badges config
 */
function copyTagsToBadgePlugin() {
	return {
		visitor: {
			ExportDefaultDeclaration( visitorPath ) {
				const properties =
					// When default export is anonymous, the declaration is an object expression
					visitorPath.node?.declaration.properties ??
					// When default export is named, the declaration is an identifier, usually the previous node
					visitorPath.getPrevSibling().node.declarations[ 0 ].init
						.properties;

				alterParameters( properties );
			},
		},
	};
}

function alterParameters( properties ) {
	const STATUS_PREFIX = 'status-';

	const tags =
		properties
			.find( ( op ) => op.key.name === 'tags' )
			?.value.elements.map( ( tag ) => tag.value ) ?? [];
	const statusTags = tags.filter( ( tag ) =>
		tag.startsWith( STATUS_PREFIX )
	);

	const badges = babel.types.objectProperty(
		babel.types.identifier( 'badges' ),
		babel.types.arrayExpression(
			statusTags.map( ( tag ) =>
				babel.types.stringLiteral(
					tag.substring( STATUS_PREFIX.length )
				)
			)
		)
	);

	let parameters = properties.find( ( op ) => op.key.name === 'parameters' );

	if ( ! parameters ) {
		parameters = babel.types.objectProperty(
			babel.types.identifier( 'parameters' ),
			babel.types.objectExpression( [] )
		);
		properties.push( parameters );
	}

	parameters.value.properties = [ badges, ...parameters.value.properties ];
}

module.exports = function ( source ) {
	const output = babel.transform( source, {
		plugins: [ copyTagsToBadgePlugin ],
		filename: this.resourcePath,
		sourceType: 'module',
	} );
	return output.code;
};
