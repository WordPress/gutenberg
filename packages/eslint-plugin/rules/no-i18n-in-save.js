/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTranslateFunctionName,
} = require( '../utils' );

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noI18nInSave:
				'Translation functions should not be used in block save functions. Translated content is saved to the database and will not update if the language changes.',
		},
		docs: {
			description: 'Disallow translation functions in block save methods',
			category: 'Best Practices',
			recommended: false,
		},
	},
	create( context ) {
		let saveFunctionDepth = 0;
		const filename = context.getFilename();

		// Skip deprecated files as they preserve old behavior including translation functions
		const normalizedFilename = filename.replace( /\\/g, '/' );
		const isDeprecatedFile =
			normalizedFilename.includes( '/deprecated.js' ) ||
			normalizedFilename.includes( '/deprecated.ts' ) ||
			normalizedFilename.includes( '/deprecated.jsx' ) ||
			normalizedFilename.includes( '/deprecated.tsx' );

		if ( isDeprecatedFile ) {
			return {};
		}

		const isSaveFile =
			normalizedFilename.endsWith( '/save.js' ) ||
			normalizedFilename.endsWith( '/save.ts' ) ||
			normalizedFilename.endsWith( '/save.jsx' ) ||
			normalizedFilename.endsWith( '/save.tsx' );

		return {
			// Track when we enter a function named 'save'
			FunctionDeclaration( node ) {
				if ( node.id && node.id.name === 'save' ) {
					saveFunctionDepth++;
				}
			},
			'FunctionDeclaration:exit'( node ) {
				if ( node.id && node.id.name === 'save' ) {
					saveFunctionDepth--;
				}
			},

			// Track arrow functions assigned to 'save'
			VariableDeclarator( node ) {
				if (
					node.id &&
					node.id.name === 'save' &&
					node.init &&
					( node.init.type === 'ArrowFunctionExpression' ||
						node.init.type === 'FunctionExpression' )
				) {
					saveFunctionDepth++;
				}
			},
			'VariableDeclarator:exit'( node ) {
				if (
					node.id &&
					node.id.name === 'save' &&
					node.init &&
					( node.init.type === 'ArrowFunctionExpression' ||
						node.init.type === 'FunctionExpression' )
				) {
					saveFunctionDepth--;
				}
			},

			// Track object properties named 'save'
			'Property[key.name="save"]'( node ) {
				if (
					node.value &&
					( node.value.type === 'FunctionExpression' ||
						node.value.type === 'ArrowFunctionExpression' )
				) {
					saveFunctionDepth++;
				}
			},
			'Property[key.name="save"]:exit'( node ) {
				if (
					node.value &&
					( node.value.type === 'FunctionExpression' ||
						node.value.type === 'ArrowFunctionExpression' )
				) {
					saveFunctionDepth--;
				}
			},

			// Check for translation function calls
			CallExpression( node ) {
				const { callee } = node;
				const functionName = getTranslateFunctionName( callee );

				if ( ! TRANSLATION_FUNCTIONS.has( functionName ) ) {
					return;
				}

				// Report if we're in a save file or inside a save function
				if ( isSaveFile || saveFunctionDepth > 0 ) {
					context.report( {
						node,
						messageId: 'noI18nInSave',
					} );
				}
			},
		};
	},
};
