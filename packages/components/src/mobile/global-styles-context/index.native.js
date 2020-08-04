/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const GlobalStylesContext = createContext( { style: {} } );

export const useGlobalStyles = () => {
	const globalStyles = useContext( GlobalStylesContext );

	return globalStyles;
};

export const withGlobalStyles = ( WrappedComponent ) => ( props ) => (
	<GlobalStylesContext.Consumer>
		{ ( globalStyles ) => (
			<WrappedComponent { ...props } globalStyles={ globalStyles } />
		) }
	</GlobalStylesContext.Consumer>
);

export default GlobalStylesContext;
