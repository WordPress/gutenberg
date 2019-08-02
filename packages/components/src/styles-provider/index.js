/**
 * WordPress dependencies
 */
import { Component, createContext, forwardRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const { Consumer, Provider } = createContext( {} );

export class StylesheetProvider extends Component {
	mergeStylesheets( parentStylesheet, styleseheet ) {
		return {
			...parentStylesheet,
			...styleseheet,
		};
	}

	render() {
		const { stylesheet, children } = this.props;

		return (
			<Consumer>
				{ ( parentStylesheet ) => (
					<Provider value={ this.mergeStylesheets( parentStylesheet, stylesheet ) }>
						{ children }
					</Provider>
				) }
			</Consumer>
		);
	}
}

StylesheetProvider.Consumer = Consumer;

export const withStylesheets = ( stylesheets ) => createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<StylesheetProvider stylesheet={ Object.assign( {}, ...stylesheets ) }>
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
