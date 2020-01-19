/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

const context = {};
const getContext = ( blockName, attributeName ) => {
	if ( ! context[ blockName ] ) {
		context[ blockName ] = {};
	}
	if ( ! context[ blockName ][ attributeName ] ) {
		context[ blockName ][ attributeName ] = createContext();
	}
	return context[ blockName ][ attributeName ];
};

function Providers( { blockType, blockAttributes, children } ) {
	for ( const [ attributeName, attributeConfig ] of Object.entries(
		blockType.attributes
	) ) {
		if (
			attributeConfig.context &&
			blockAttributes[ attributeName ] !== undefined
		) {
			const Provider = getContext( blockType.name, attributeName ).Provider;
			children = (
				<Provider value={ blockAttributes[ attributeName ] }>{ children }</Provider>
			);
		}
	}
	return children;
}
function BlockContext( {
	blockType,
	blockAttributes,
	Component,
	...componentProps
} ) {
	const blockContext = {};
	if ( blockType.context ) {
		for ( const [ attributeName, blockNameOrBlockNames ] of Object.entries(
			blockType.context
		) ) {
			const blockNames = castArray( blockNameOrBlockNames );
			for ( const blockName of blockNames ) {
				// eslint-disable-next-line react-hooks/rules-of-hooks
				const contextValue = useContext( getContext( blockName, attributeName ) );
				if ( contextValue !== undefined ) {
					blockContext[ attributeName ] = contextValue;
				}
			}
		}
	}
	return (
		<Providers blockType={ blockType } blockAttributes={ blockAttributes }>
			<Component
				{ ...componentProps }
				context={ useMemo( () => blockContext, Object.values( blockContext ) ) }
			/>
		</Providers>
	);
}
BlockContext.Providers = Providers;
export default BlockContext;
