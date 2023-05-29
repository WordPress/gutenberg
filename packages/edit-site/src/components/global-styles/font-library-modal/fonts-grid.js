/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function FontsGrid( { children } ) {
	return (
		<div className='font-library-modal__font-card-grid'>
			{ children }
		</div>
	);
}

export default FontsGrid;
