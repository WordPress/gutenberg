import { createContext, useContext } from '@wordpress/element';
import { getLayoutType } from '../../layouts';
import { useSettings } from '../use-settings';
import type { Layout, LayoutStyleArgs } from '../../layouts/types';

export const defaultLayout: Layout = { type: 'default' };

const Layout = createContext< Layout >( defaultLayout );
Layout.displayName = 'BlockLayoutContext';

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

export function LayoutStyle( {
	layout = {},
	css,
	...props
}: Partial< LayoutStyleArgs > & { css?: string } ) {
	const layoutType = getLayoutType( layout.type );
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
	// Like the server's `isset()` check, an unset or `null` setting means the
	// theme has not opted into block gap.
	const hasBlockGapSupport =
		blockGapSupport !== null && blockGapSupport !== undefined;

	if ( layoutType ) {
		if ( css ) {
			return <style>{ css }</style>;
		}
		// As before, unset arguments, such as a missing block name, pass through.
		const layoutStyle = layoutType.getLayoutStyle?.( {
			hasBlockGapSupport,
			layout,
			...props,
		} as LayoutStyleArgs );
		if ( layoutStyle ) {
			return <style>{ layoutStyle }</style>;
		}
	}
	return null;
}
