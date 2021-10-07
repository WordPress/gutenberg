/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getLayoutType } from '../../layouts';

export const defaultLayout = { type: 'default' };

const Layout = createContext( defaultLayout );

/**
 * Allows to define the layout.
 */
export const LayoutProvider = Layout.Provider;

/**
 * React hook used to retrieve the layout config.
 */
export function useLayout() {
	return useContext( Layout );
}

export function LayoutStyle( { layout = {}, ...props } ) {
	const layoutType = getLayoutType( layout.type );

	if ( layoutType ) {
		return <layoutType.save layout={ layout } { ...props } />;
	}

	return null;
}
