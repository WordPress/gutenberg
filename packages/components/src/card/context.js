/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const CardContext = createContext( {} );
export const useCardContext = () => useContext( CardContext );

export const CardProvider = ( props ) => {
	const { Provider } = CardContext;
	const { children, size, variant } = props;
	const value = {
		size,
		variant,
	};

	return <Provider value={ value }>{ children }</Provider>;
};
