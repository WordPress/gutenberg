/**
 * WordPress dependencies
 */
import { Component, createContext, forwardRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const { Consumer, Provider } = createContext( [] );

export class StylesheetProvider extends Component {
	render() {
		const { stylesheets, children } = this.props;
		const rawStylesheet = stylesheets.reduce(
			( memo, stylesheet ) => memo.concat( stylesheet.__rawStyles ),
			[]
		)

		return (
			<Consumer>
				{ ( parentStylesheet ) => {
					return (
						<Provider value={ parentStylesheet.concat( rawStylesheet ) }>
							{ children }
						</Provider>
					);
				} }
			</Consumer>
		);
	}
}

StylesheetProvider.Consumer = Consumer;

export const withStylesheets = ( stylesheets ) => createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<StylesheetProvider stylesheets={ stylesheets }>
			<OriginalComponent { ...props } />
		</StylesheetProvider>
	);
}, 'withStylesheets' );

export const withStyles = createHigherOrderComponent( ( OriginalComponent ) => {
	return forwardRef( ( props, ref ) => (
		<Consumer>
			{ ( stylesheet ) => (
				<OriginalComponent
					ref={ ref }
					{ ...props }
					stylesheet={ stylesheet }
				/>
			) }
		</Consumer>
	) );
}, 'withStyles' );
