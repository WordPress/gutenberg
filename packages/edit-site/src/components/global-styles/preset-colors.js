/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useStylesPreviewColors } from './hooks';
import { unlock } from '../../lock-unlock';

export default function PresetColors() {
	const { useGlobalStyle } = unlock( blockEditorPrivateApis );
	const { paletteColors } = useStylesPreviewColors();
	const [ backgroundColorValue ] = useGlobalStyle( 'color.background' );
	const [ textColorValue ] = useGlobalStyle( 'color.text' );

	const backgroundColorIndex = paletteColors.findIndex(
		( { color } ) => color === backgroundColorValue
	);
	const textColorIndex = paletteColors.findIndex(
		( { color } ) => color === textColorValue
	);

	if ( backgroundColorIndex !== -1 ) {
		const backgroundColor = paletteColors.splice(
			backgroundColorIndex,
			1
		)[ 0 ];
		paletteColors.unshift( backgroundColor );
	}
	if ( textColorIndex !== -1 ) {
		const textColor = paletteColors.splice( textColorIndex, 1 )[ 0 ];
		paletteColors.splice( 1, 0, textColor );
	}

	const firstFiveColors = paletteColors.slice( 0, 5 );

	return firstFiveColors.map( ( { slug, color }, index ) => (
		<div
			key={ `${ slug }-${ index }` }
			style={ {
				flexGrow: 1,
				height: '100%',
				background: color,
			} }
		/>
	) );
}
