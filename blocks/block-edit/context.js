/**
 * External dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

const { Consumer, Provider } = createContext( {
	isSelected: true,
} );

export { Provider as BlockEditContextProvider };

/**
 * A Higher Order Component used to inject BlockEdit context to the
 * wrapped component.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which has BlockEdit context injected.
 */
export const withBlockEditContext = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( context ) => (
				<OriginalComponent
					{ ...props }
					blockEditContext={ context }
				/>
			) }
		</Consumer>
	);
}, 'withBlockEditContext' );

/**
 * A Higher Order Component used to render conditionally the wrapped
 * component only when the BlockEdit has selected state set.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which renders only when the BlockEdit is selected.
 */
export const ifBlockEditSelected = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( { isSelected } ) => isSelected && (
				<OriginalComponent { ...props } />
			) }
		</Consumer>
	);
}, 'ifBlockEditSelected' );
