/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export default function CanvasSpinner() {
	const [ textColor ] = useGlobalStyle( 'color.text' );

	return (
		<div className="edit-site-canvas-spinner">
			<Spinner style={ { color: textColor } } />
		</div>
	);
}
