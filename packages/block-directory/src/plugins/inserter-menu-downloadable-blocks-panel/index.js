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
				if ( debouncedFilterValue !== filterValue ) {
					debouncedSetFilterValue( filterValue );
				}

				if ( ! debouncedFilterValue ) {
					return null;
				}

				return (
					<DownloadableBlocksPanel
						onSelect={ onSelect }
						onHover={ onHover }
						rootClientId={ rootClientId }
						filterValue={ debouncedFilterValue }
						hasLocalBlocks={ hasItems }
						isTyping={ filterValue !== debouncedFilterValue }
					/>
				);
			} }
		</__experimentalInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
