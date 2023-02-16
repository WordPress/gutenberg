/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSupportedStyles } from './hooks';
import { unlock } from '../../private-apis';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export function useHasColorPanel( name ) {
	const supports = useSupportedStyles( name );
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( 'linkColor' )
	);
}

/**
 * Gets color values for use in the `ContrastChecker` component.
 *
 * @param {string} name      The block name, or undefined for the root.
 * @param {string} variation The variation name, or empty string when no variation is in use.
 * @return {Object} The colors to use in the contrast checker.
 */
export function useContrastCheckerColors( name, variation = '' ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ backgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name
	);
	const [ textColor ] = useGlobalStyle( prefix + 'color.text', name );
	const [ linkColor ] = useGlobalStyle(
		prefix + 'elements.link.color.text',
		name
	);

	return {
		textColor,
		backgroundColor,
		linkColor,
	};
}
