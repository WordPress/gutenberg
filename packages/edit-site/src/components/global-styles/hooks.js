/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useSelect } from '@wordpress/data';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

export function useColorRandomizer( name ) {
	const [ themeColors, setThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name
	);

	function randomizeColors() {
		/* eslint-disable no-restricted-syntax */
		const randomRotationValue = Math.floor( Math.random() * 225 );
		/* eslint-enable no-restricted-syntax */

		const newColors = themeColors.map( ( colorObject ) => {
			const { color } = colorObject;
			const newColor = colord( color )
				.rotate( randomRotationValue )
				.toHex();

			return {
				...colorObject,
				color: newColor,
			};
		} );

		setThemeColors( newColors );
	}

	return window.__experimentalEnableColorRandomizer
		? [ randomizeColors ]
		: [];
}

export function useSupportedStyles( name, element ) {
	const { supportedPanels } = useSelect(
		( select ) => {
			return {
				supportedPanels: unlock(
					select( blocksStore )
				).getSupportedStyles( name, element ),
			};
		},
		[ name, element ]
	);

	return supportedPanels;
}
