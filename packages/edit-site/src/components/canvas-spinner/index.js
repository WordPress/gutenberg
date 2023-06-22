/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';

extend( [ mixPlugin ] );

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useStylesPreviewColors } from '../global-styles/hooks';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export default function CanvasSpinner() {
	const [ textColor ] = useGlobalStyle( 'color.text' );
	const { highlightedColors } = useStylesPreviewColors();

	const trackColor = highlightedColors[ 0 ]?.color ?? textColor;
	const trackColord = colord( trackColor );
	const indicatorColor = trackColord.isDark()
		? trackColord.tints( 3 )[ 1 ].toHex()
		: trackColord.shades( 3 )[ 1 ].toHex();

	return (
		<div className="edit-site-canvas-spinner">
			<Spinner
				style={ { color: trackColor } }
				trackStyles={ { stroke: indicatorColor } }
			/>
		</div>
	);
}
