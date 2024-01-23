/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getLayoutType } from '../../layouts';
import { useSettings } from '../use-settings';

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

export function LayoutStyle( { layout = {}, css, ...props } ) {
	const layoutType = getLayoutType( layout.type );
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGapSupport !== null;

	if ( layoutType ) {
		if ( css ) {
			return <style>{ css }</style>;
		}
		const layoutStyle = layoutType.getLayoutStyle?.( {
			hasBlockGapSupport,
			layout,
			...props,
		} );
		if ( layoutStyle ) {
			return <style>{ layoutStyle }</style>;
		}
	}
	return null;
}
