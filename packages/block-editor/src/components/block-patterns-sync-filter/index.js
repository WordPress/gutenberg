/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

const SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};
const SYNC_FILTERS = {
	all: __( 'All' ),
	[ SYNC_TYPES.full ]: __( 'Synced' ),
	[ SYNC_TYPES.unsynced ]: __( 'Standard' ),
};

export default function BlockPatternsSyncFilter( {
	setSyncFilter,
	syncFilter,
} ) {
	return (
		<ToggleGroupControl
			className="block-editor-patterns__sync-status-filter"
			hideLabelFromVision
			label={ __( 'Filter by sync status' ) }
			value={ syncFilter }
			isBlock
			onChange={ ( value ) => setSyncFilter( value ) }
			__nextHasNoMarginBottom
		>
			{ Object.entries( SYNC_FILTERS ).map( ( [ key, optionLabel ] ) => (
				<ToggleGroupControlOption
					className="block-editor-patterns__sync-status-filter-option"
					key={ key }
					value={ key }
					label={ optionLabel }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
