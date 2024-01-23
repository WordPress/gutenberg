/**
 * WordPress dependencies
 */
import { __unstableInserterMenuExtension } from '@wordpress/block-editor';
import { debounce } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DownloadableBlocksPanel from '../../components/downloadable-blocks-panel';

function InserterMenuDownloadableBlocksPanel() {
	const [ debouncedFilterValue, setFilterValue ] = useState( '' );
	const debouncedSetFilterValue = debounce( setFilterValue, 400 );

	return (
		<__unstableInserterMenuExtension>
			{ ( { onSelect, onHover, filterValue, hasItems } ) => {
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
						filterValue={ debouncedFilterValue }
						hasLocalBlocks={ hasItems }
						isTyping={ filterValue !== debouncedFilterValue }
					/>
				);
			} }
		</__unstableInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
