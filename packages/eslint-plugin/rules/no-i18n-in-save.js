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
			recommended: true,
		},
	},
	create( context ) {
		let insideSaveFunction = false;
		const filename = context.getFilename();

		// Skip deprecated files as they preserve old behavior including translation functions
		const isDeprecatedFile =
			filename.includes( '/deprecated.js' ) ||
			filename.includes( '/deprecated.ts' ) ||
			filename.includes( '/deprecated.jsx' ) ||
			filename.includes( '/deprecated.tsx' );

		if ( isDeprecatedFile ) {
			return {};
		}

		const isSaveFile =
			filename.endsWith( '/save.js' ) ||
			filename.endsWith( '/save.ts' ) ||
			filename.endsWith( '/save.jsx' ) ||
			filename.endsWith( '/save.tsx' );

		return {
			// Track when we enter a function named 'save'
			FunctionDeclaration( node ) {
				if ( node.id && node.id.name === 'save' ) {
					insideSaveFunction = true;
				}
			},
			'FunctionDeclaration:exit'( node ) {
				if ( node.id && node.id.name === 'save' ) {
					insideSaveFunction = false;
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
					insideSaveFunction = true;
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
					insideSaveFunction = false;
				}
			},

			// Track object properties named 'save'
			'Property[key.name="save"]'( node ) {
				if (
					node.value &&
					( node.value.type === 'FunctionExpression' ||
						node.value.type === 'ArrowFunctionExpression' )
				) {
					insideSaveFunction = true;
				}
			},
			'Property[key.name="save"]:exit'( node ) {
				if (
					node.value &&
					( node.value.type === 'FunctionExpression' ||
						node.value.type === 'ArrowFunctionExpression' )
				) {
					insideSaveFunction = false;
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
				if ( isSaveFile || insideSaveFunction ) {
					context.report( {
						node,
						messageId: 'noI18nInSave',
					} );
				}
			},
		};
	},
};
