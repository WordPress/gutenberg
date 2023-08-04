/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';

extend( [ mixPlugin ] );

/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useStylesPreviewColors } from '../global-styles/hooks';

const { ProgressBar, Theme } = unlock( componentsPrivateApis );
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export default function CanvasSpinner() {
	const [ fallbackIndicatorColor ] = useGlobalStyle( 'color.text' );
	const { highlightedColors } = useStylesPreviewColors();

	const indicatorColor =
		highlightedColors[ 0 ]?.color ?? fallbackIndicatorColor;
	const grayscaleIndicatorColor = colord( indicatorColor ).grayscale();
	const trackColorBase = grayscaleIndicatorColor.isDark()
		? grayscaleIndicatorColor.tints( 3 )[ 1 ]
		: grayscaleIndicatorColor.shades( 3 )[ 1 ];
	const trackColor = trackColorBase.alpha( 0.5 ).toHex();

	return (
		<div className="edit-site-canvas-spinner">
			<Theme accent={ indicatorColor } background={ trackColor }>
				<ProgressBar />
			</Theme>
		</div>
	);
}
