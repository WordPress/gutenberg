/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

const { Consumer, Provider } = createContext( {
	name: null,
	icon: null,
} );

export { Provider as PluginContextProvider };

/**
 * A Higher Order Component used to inject Plugin context to the
 * wrapped component.
 *
 * @param {Function} mapContextToProps Function called on every context change,
 *                                     expected to return object of props to
 *                                     merge with the component's own props.
 *
 * @return {WPComponent} Enhanced component with injected context as props.
 */
export const withPluginContext = ( mapContextToProps ) =>
	createHigherOrderComponent( ( OriginalComponent ) => {
		/**
		 * Wrap the passed component in a withSelect to allow passing data to it.
		 */
		return withSelect( ( select ) => {
			return {
				editorContext: {
					currentPostType: select(
						'core/editor'
					).getCurrentPostType(),
				},
			};
		} )( ( props ) => {
			return (
				<Consumer>
					{ ( context ) => (
						<OriginalComponent
							{ ...props }
							{ ...mapContextToProps( context, props ) }
						/>
					) }
				</Consumer>
			);
		} );
	}, 'withPluginContext' );
