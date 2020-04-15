/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const WrapperStyleContext = createContext( { style: {} } );

export default WrapperStyleContext;

export const useWrapperStyle = () => {
	const wrapperStyle = useContext( WrapperStyleContext );

	return wrapperStyle;
};

export const withWrapperStyle = ( WrappedComponent ) => ( props ) => (
	<WrapperStyleContext.Consumer>
		{ ( wrapperStyle ) => (
			<WrappedComponent { ...props } wrapperStyle={ wrapperStyle } />
		) }
	</WrapperStyleContext.Consumer>
);
