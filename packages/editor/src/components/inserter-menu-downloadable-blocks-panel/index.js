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
	const [ state, setState ] = useState( {
		debouncedFilterValue: '',
	} );

	const debouncedSetState = debounce( setState, 400 );

	return (
		<__experimentalInserterMenuExtension>
			{
				( { onSelect, onHover, filterValue, isMenuEmpty } ) => {
					if ( ! isMenuEmpty ) {
						return null;
					}

					if ( state.debouncedFilterValue !== filterValue ) {
						debouncedSetState( {
							debouncedFilterValue: filterValue,
						} );
					}

					return (
						<DownloadableBlocksPanel
							onSelect={ onSelect }
							onHover={ onHover }
							filterValue={ state.debouncedFilterValue }
						/>
					);
				}
			}
		</__experimentalInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
