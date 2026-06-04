/**
 * Internal dependencies
 */
const {
	createDOMGlobalRule,
	isReturnValueJSX,
} = require( '../utils/dom-globals' );

module.exports = createDOMGlobalRule( {
	description:
		'Disallow use of DOM globals in the render cycle of a React function component',
	message:
		"Use of DOM global '{{name}}' is forbidden in the render-cycle of a React FC, consider moving this inside useEffect()",
	test( scope ) {
		return isReturnValueJSX( scope );
	},
} );
