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

const { ProgressBar } = unlock( componentsPrivateApis );
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export default function CanvasSpinner() {
	const [ fallbackTrackColor ] = useGlobalStyle( 'color.text' );
	const { highlightedColors } = useStylesPreviewColors();

	const trackColor = highlightedColors[ 1 ]?.color ?? fallbackTrackColor;
	const trackColord = colord( trackColor );
	const fallbackIndicatorColor = trackColord.isDark()
		? trackColord.tints( 3 )[ 1 ].toHex()
		: trackColord.shades( 3 )[ 1 ].toHex();
	const indicatorColor =
		highlightedColors[ 0 ]?.color ?? fallbackIndicatorColor;

	return (
		<div className="edit-site-canvas-spinner">
			<ProgressBar
				indicatorColor={ indicatorColor }
				trackColor={ trackColor }
			/>
		</div>
	);
}
