/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

export default function CanvasSpinner( { spinnerStyle } ) {
	return (
		<div className="edit-site-canvas-spinner">
			<Spinner style={ spinnerStyle } />
		</div>
	);
}
