/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	type: 'problem',
	meta: {
		messages: {
			noUnsafeFeatures:
				'Usage of `{{importedName}}` from `{{sourceModule}}` is not allowed',
		},
		schema: [
			{
				type: 'object',
				additionalProperties: false,
				patternProperties: {
					'^@wordpress\\/[a-zA-Z0-9_-]+$': {
						type: 'array',
						uniqueItems: true,
						minItems: 1,
						items: {
							type: 'string',
							pattern: '^__experimental',
						},
					},
				},
			},
		],
	},
	create( context ) {
		/** @type {AllowedImportsMap} */
		const allowedImports =
			( context.options &&
				typeof context.options[ 0 ] === 'object' &&
				context.options[ 0 ] ) ||
			{};
		const reporter = makeListener( { allowedImports, context } );

		return { ImportDeclaration: reporter };
	},
};

/**
 * @param {Object} _
 * @param {AllowedImportsMap} _.allowedImports
 * @param {import('eslint').Rule.RuleContext} _.context
 *
 * @return {(node: Node) => void} Listener function
 */
function makeListener( { allowedImports, context } ) {
	return function reporter( node ) {
		if ( node.type !== 'ImportDeclaration' ) {
			return;
		}
		if ( typeof node.source.value !== 'string' ) {
			return;
		}

		const sourceModule = node.source.value.trim();

		// Only interested in @wordpress/* packages
		if ( ! sourceModule.startsWith( '@wordpress/' ) ) {
			return;
		}

		const allowedImportNames = allowedImports[ sourceModule ] || [];

		node.specifiers.forEach( ( specifierNode ) => {
			if ( specifierNode.type !== 'ImportSpecifier' ) {
				return;
			}

			const importedName = specifierNode.imported.name;

			const data = {
				sourceModule,
				importedName,
			};

			if (
				// Unstable is never allowed
				importedName.startsWith( '__unstable' ) ||
				// Experimental may be allowed
				( importedName.startsWith( '__experimental' ) &&
					! allowedImportNames.includes( importedName ) )
			) {
				context.report( {
					messageId: 'noUnsafeFeatures',
					node: specifierNode,
					data,
				} );
			}
		} );
	};
}

/** @typedef {import('estree').Node} Node */
/** @typedef {Record<string, string[]|undefined>} AllowedImportsMap */
