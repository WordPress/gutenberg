export default function( babel ) {
	const { types: t } = babel;

	function addNamespaceToWithSelect( path, namespace ) {
		let parentPath = path;
		while ( ( parentPath = parentPath.parentPath ) ) {
			const { node } = parentPath;
			if ( node.type !== 'CallExpression' || node.callee.name !== 'withSelect' ) {
				continue;
			}

			let reducerKeys;
			if ( node.arguments.length > 1 ) {
				const reducerKeysNode = node.arguments[ 1 ];
				switch ( reducerKeysNode.type ) {
					case 'ArrayExpression':
						reducerKeys = reducerKeysNode.elements.reduce( ( result, element ) => {
							if ( element.type === 'StringLiteral' ) {
								result.push( element.value );
							}

							return result;
						}, [] );
						break;
					case 'StringLiteral':
						reducerKeys = [ reducerKeysNode.value ];
						break;
				}

				if ( reducerKeys.includes( namespace ) ) {
					break;
				}

				reducerKeys.push( namespace );
				reducerKeys = reducerKeys.map( ( key ) => t.stringLiteral( key ) );
				const argumentPaths = parentPath.get( 'arguments' );
				argumentPaths[ 1 ].replaceWith( t.arrayExpression( reducerKeys ) );
			} else {
				parentPath.pushContainer( 'arguments', t.stringLiteral( namespace ) );
			}

			break;
		}
	}

	return {
		visitor: {
			CallExpression: {
				exit( path ) {
					const { node } = path;
					if ( node.callee.name === 'select' && node.arguments.length > 0 && node.arguments[ 0 ].type === 'StringLiteral' ) {
						addNamespaceToWithSelect( path, node.arguments[ 0 ].value );
					}
				},
			},
		},
	};
}
