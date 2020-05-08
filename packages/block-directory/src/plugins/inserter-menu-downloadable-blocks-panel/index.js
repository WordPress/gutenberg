/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalInserterMenuExtension } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DownloadableBlocksPanel from '../../components/downloadable-blocks-panel';

function InserterMenuDownloadableBlocksPanel() {
	const [ debouncedFilterValue, setFilterValue ] = useState( '' );

	const debouncedSetFilterValue = debounce( setFilterValue, 400 );

	return (
		<__experimentalInserterMenuExtension>
			{ ( {
				onSelect,
				onHover,
				filterValue,
				hasItems,
				rootClientId,
			} ) => {
				if ( hasItems || ! filterValue ) {
					return null;
				}

				if ( debouncedFilterValue !== filterValue ) {
					debouncedSetFilterValue( filterValue );
				}

				return (
					<DownloadableBlocksPanel
						onSelect={ onSelect }
						onHover={ onHover }
						filterValue={ debouncedFilterValue }
						isWaiting={ filterValue !== debouncedFilterValue }
						rootClientId={ rootClientId }
					/>
				);
			} }
		</__experimentalInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
