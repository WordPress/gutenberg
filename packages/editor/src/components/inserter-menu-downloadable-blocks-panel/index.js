/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalInserterMenuExtension } from '@wordpress/block-editor';
import { DownloadableBlocksPanel } from '@wordpress/block-directory';
import { useState } from '@wordpress/element';

function InserterMenuDownloadableBlocksPanel() {
	const [ debouncedFilterValue, setFilterValue ] = useState( '' );

	const debouncedSetFilterValue = debounce( setFilterValue, 400 );

	return (
		<__experimentalInserterMenuExtension>
			{
				( { onSelect, onHover, filterValue, hasItems } ) => {
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
						/>
					);
				}
			}
		</__experimentalInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
