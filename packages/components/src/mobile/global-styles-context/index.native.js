/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from '../../../../block-library/src/style.native.scss';

const GlobalStylesContext = createContext( styles );

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
