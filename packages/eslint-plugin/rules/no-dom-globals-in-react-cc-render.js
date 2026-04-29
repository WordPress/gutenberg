/**
 * Internal dependencies
 */
const {
	createDOMGlobalRule,
	isReturnValueJSX,
} = require( '../utils/dom-globals' );

module.exports = createDOMGlobalRule( {
	description:
		'Disallow use of DOM globals in render() method of a React class component',
	message:
		"Use of DOM global '{{name}}' is forbidden in render(), consider moving this to componentDidMount()",
	test( scope ) {
		if ( scope.block?.parent ) {
			const { type, kind, key } = scope.block.parent;
			return (
				type === 'MethodDefinition' &&
				kind === 'method' &&
				key.name === 'render' &&
				isReturnValueJSX( scope )
			);
		}
		return false;
	},
} );
