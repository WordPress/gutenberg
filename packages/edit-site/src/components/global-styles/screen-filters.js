/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DuotonePanel from './duotone-panel';
import BlockPreviewPanel from './block-preview-panel';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';

function ScreenFilters( { name } ) {
	return (
		<>
			<ScreenHeader title={ __( 'Filters' ) } />
			<BlockPreviewPanel name={ name } />
			<DuotonePanel name={ name } />
		</>
	);
}

export default ScreenFilters;
