/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const Context = createContext( {
	name: '',
	isSelected: false,
	focusedElement: null,
	setFocusedElement: noop,
	clientId: null,
} );
const { Provider, Consumer } = Context;

export { Provider as BlockEditContextProvider };

/**
 * A hook that returns the block edit context.
 *
 * @return {Object} Block edit context
 */
export function useBlockEditContext() {
	return useContext( Context );
}

/**
 * A Higher Order Component used to inject BlockEdit context to the
 * wrapped component.
 *
 * @param {Function} mapContextToProps Function called on every context change,
 *                                     expected to return object of props to
 *                                     merge with the component's own props.
 *
 * @return {WPComponent} Enhanced component with injected context as props.
 */
export const withBlockEditContext = ( mapContextToProps ) =>
	createHigherOrderComponent( ( OriginalComponent ) => {
		return ( props ) => (
			<Consumer>
				{ ( context ) => (
					<OriginalComponent
						{ ...props }
						{ ...mapContextToProps( context, props ) }
					/>
				) }
			</Consumer>
		);
	}, 'withBlockEditContext' );
