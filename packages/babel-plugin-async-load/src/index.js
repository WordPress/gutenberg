const lazyLoadTemplate = `
var COMPONENT_NAME = wp.compose.lazyLoad( SCRIPTS, STYLES, BASE_URL)( WRAPPED_COMPONENT );
`;

export default function( babel ) {
	const { types: t, template } = babel;

	return {
		visitor: {
			Program: function( path, state ) {
				// 1. Find occurences to replace
				const mappings = [];
				const importVisitor = {
					ImportSpecifier: function( subPath ) {
						state.opts.components.forEach( ( componentConfig ) => {
							if (
								subPath.parent.source.value === componentConfig.module &&
								subPath.node.imported.name === componentConfig.component
							) {
								// Add the Wrapper
								const buildRequire = template( lazyLoadTemplate );
								const ast = buildRequire( {
									WRAPPED_COMPONENT: t.identifier( subPath.node.local.name ),
									COMPONENT_NAME: t.identifier( 'LazyLoad' + subPath.node.local.name ),
									SCRIPTS: t.arrayExpression( componentConfig.scripts.map( ( script ) => t.stringLiteral( script ) ) ),
									STYLES: t.arrayExpression( componentConfig.styles.map( ( style ) => t.stringLiteral( style ) ) ),
									BASE_URL: t.identifier( state.opts.siteURLSource ),
								} );
								const parent = subPath.findParent( ( parentPath ) => !! parentPath.insertAfter );
								parent.insertAfter( ast );

								// Enqueue component replacement
								mappings.push( {
									identifier: subPath.node.local.name,
									replacement: 'LazyLoad' + subPath.node.local.name,
								} );
							}
						} );
					},
				};
				path.traverse( importVisitor );

				// 2. Replace all occurences
				const replaceOccurences = {
					JSXIdentifier: function( subPath ) {
						const mapping = this.mappings.find(
							( current ) => current.identifier === subPath.node.name
						);
						if ( mapping ) {
							subPath.node.name = mapping.replacement;
						}
					},
				};
				path.traverse( replaceOccurences, { mappings } );
			},
		},
	};
}
