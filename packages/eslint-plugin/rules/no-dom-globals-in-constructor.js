const {
	createDOMGlobalRule,
	isReactClassComponent,
} = require( '../utils/dom-globals' );

module.exports = createDOMGlobalRule( {
	description:
		'Disallow use of DOM globals in React class component constructors',
	message:
		"Use of DOM global '{{name}}' is forbidden in React class component constructors, consider moving this to componentDidMount()",
	test( scope ) {
		if ( ! scope.block?.parent ) {
			return false;
		}

		const { type, kind } = scope.block.parent;
		if ( type !== 'MethodDefinition' || kind !== 'constructor' ) {
			return false;
		}

		const classNode = scope.block.parent.parent?.parent;
		return isReactClassComponent( classNode );
	},
} );
