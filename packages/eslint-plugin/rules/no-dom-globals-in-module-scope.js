/**
 * Internal dependencies
 */
const { createDOMGlobalRule } = require( '../utils/dom-globals' );

module.exports = createDOMGlobalRule( {
	description: 'Disallow use of DOM globals in module scope',
	message: "Use of DOM global '{{name}}' is forbidden in module scope",
	test( scope ) {
		return scope.type === 'module' || scope.type === 'global';
	},
} );
