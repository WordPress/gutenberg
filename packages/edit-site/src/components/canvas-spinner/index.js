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

export default function CanvasSpinner( { id } ) {
	const [ fallbackIndicatorColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const { highlightedColors } = useStylesPreviewColors();
	const indicatorColor =
		highlightedColors[ 0 ]?.color ?? fallbackIndicatorColor;

	return (
		<div className="edit-site-canvas-spinner">
			<Theme accent={ indicatorColor } background={ backgroundColor }>
				<ProgressBar id={ id } />
			</Theme>
		</div>
	);
}
