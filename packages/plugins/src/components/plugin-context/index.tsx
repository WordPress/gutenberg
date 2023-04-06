/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { WPPlugin } from '../../api';

interface PluginContext {
	name: null | WPPlugin[ 'name' ];
	icon: null | WPPlugin[ 'icon' ];
}

const { Consumer, Provider } = createContext< PluginContext >( {
	name: null,
	icon: null,
} );

export { Provider as PluginContextProvider };

/**
 * A Higher Order Component used to inject Plugin context to the
 * wrapped component.
 *
 * @param mapContextToProps Function called on every context change,
 *                          expected to return object of props to
 *                          merge with the component's own props.
 *
 * @return Enhanced component with injected context as props.
 */
export const withPluginContext = ( mapContextToProps: Function ) =>
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
	}, 'withPluginContext' );
