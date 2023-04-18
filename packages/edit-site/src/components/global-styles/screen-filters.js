/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FiltersPanel from './filters-panel';
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
			<FiltersPanel name={ name } />
		</>
	);
}

export default ScreenFilters;
