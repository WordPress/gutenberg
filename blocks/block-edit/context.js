/**
 * External dependencies
 */
import { createContext, getWrapperDisplayName } from '@wordpress/element';

const EditBlockContext = createContext( {
	isSelected: true,
} );

/**
 * A Higher Order Component used to be provide a context for BlockEdit
 * component.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component with a BlockEdit context set.
 */
export const withEditBlockContextProvider = ( OriginalComponent ) => {
	const EnhancedComponent = ( props ) => (
		<EditBlockContext.Provider value={ { isSelected: props.isSelected } }>
			<OriginalComponent { ...props } />
		</EditBlockContext.Provider>
	);

	EnhancedComponent.displayName = getWrapperDisplayName( OriginalComponent, 'withEditBlockContextProvider' );

	return EnhancedComponent;
};

/**
 * A Higher Order Component used to render conditionally the wrapped
 * component only when the BlockEdit has selected state set.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which renders only when the BlockEdit is selected.
 */
export const ifEditBlockSelected = ( OriginalComponent ) => {
	const EnhancedComponent = ( props ) => (
		<EditBlockContext.Consumer>
			{ ( { isSelected } ) => isSelected && (
				<OriginalComponent { ...props } />
			) }
		</EditBlockContext.Consumer>
	);

	EnhancedComponent.displayName = getWrapperDisplayName( OriginalComponent, 'ifEditBlockSelected' );

	return EnhancedComponent;
};
