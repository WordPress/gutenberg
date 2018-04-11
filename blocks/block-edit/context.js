/**
 * External dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

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
export const withEditBlockContextProvider = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<EditBlockContext.Provider value={ { isSelected: props.isSelected } }>
			<OriginalComponent { ...props } />
		</EditBlockContext.Provider>
	);
}, 'withEditBlockContextProvider' );

/**
 * A Higher Order Component used to render conditionally the wrapped
 * component only when the BlockEdit has selected state set.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which renders only when the BlockEdit is selected.
 */
export const ifEditBlockSelected = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<EditBlockContext.Consumer>
			{ ( { isSelected } ) => isSelected && (
				<OriginalComponent { ...props } />
			) }
		</EditBlockContext.Consumer>
	);
}, 'ifEditBlockSelected' );
