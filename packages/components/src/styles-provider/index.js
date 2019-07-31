/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const { Consumer, Provider } = createContext( {} );

const mergeStylesheets = ( ...styleseheets ) => {
    return Object.assign( {}, ...styleseheets);
};

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
                { parentStylesheet => (
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
    return ( props ) => (
        <Consumer>
            { stylesheet => (
                <OriginalComponent
                    { ...props }
                    stylesheet={ stylesheet }
                />
            ) }
        </Consumer>
    );
}, 'withStyles' );
