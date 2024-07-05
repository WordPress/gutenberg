const getFirstPropertyName = ( obj ) => {
	const keys = Object.keys( obj );
	return keys.length > 0 ? keys[ 0 ] : undefined;
};

const groupByPath = ( array ) => {
	return array.reduce( ( acc, obj ) => {
		const key = obj.path;
		if ( ! acc[ key ] ) {
			acc[ key ] = [];
		}
		acc[ key ].push( obj );
		return acc;
	}, {} );
};

const adaptFunctionsFormat = ( symbolFunction ) => {
	const {
		description: functionDescription,
		name: functionName,
		tags: functionTags,
	} = symbolFunction;
	return {
		name: functionName,
		line: symbolFunction.lineStart,
		end_line: symbolFunction.lineEnd,
		arguments: functionTags
			.filter( ( tagItem ) => tagItem.tag === 'param' )
			.map(
				( {
					name: paramName,
					type: paramType,
					description: paramDescription,
				} ) => ( {
					name: paramName,
					type: paramType,
					description: paramDescription,
				} )
			),
		docs: {
			description: functionDescription,
			tags: functionTags
				.filter( ( tagItem ) =>
					[ 'param', 'return' ].includes( tagItem.tag )
				)
				.map(
					( {
						tag: paramOrReturn,
						name: paramOrReturnName,
						type: paramOrReturnDataType,
						description: paramOrReturnDescription,
					} ) => {
						return {
							name: paramOrReturn,
							variable: paramOrReturnName,
							type: paramOrReturnDataType,
							content: paramOrReturnDescription,
						};
					}
				),
		},
	};
};

module.exports = { groupByPath, getFirstPropertyName, adaptFunctionsFormat };
