/**
 * Internal dependencies
 */
const { createDOMGlobalRule } = require( '../utils/dom-globals' );

module.exports = createDOMGlobalRule( {
	description: 'Disallow use of DOM globals in class constructors',
	message:
		"Use of DOM global '{{name}}' is forbidden in class constructors, consider moving this to componentDidMount() or equivalent for non React components",
	test( scope ) {
		if ( scope.block?.parent ) {
			const { type, kind } = scope.block.parent;
			return type === 'MethodDefinition' && kind === 'constructor';
		}
		return false;
	},
} );
