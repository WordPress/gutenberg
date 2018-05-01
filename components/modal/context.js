/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

const { Consumer, Provider } = createContext( {
	elementId: null,
} );

export { Provider as ModalContextProvider };

/**
 * A Higher-order Component used to inject Modal context into the wrapped
 * component.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component with Modal context injected.
 */
export const withModalContext = createHigherOrderComponent(
	( OriginalComponent ) => ( props ) => (
		<Consumer>
			{ ( modalContext ) => (
				<OriginalComponent
					{ ...props }
					modalContext={ modalContext }
				/>
			) }
		</Consumer>
	),
	'withModalContext'
);
