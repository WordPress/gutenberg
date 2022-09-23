/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListbox from '../inserter-listbox';
import ImageExplorerButton from './image-exlorer/explorer-button';
import ImageResults from './image-exlorer/image-results';

export default function ImagesTab( { rootClientId, onInsert } ) {
	const onClick = useCallback(
		( image ) => {
			onInsert( [
				createBlock( 'core/image', {
					url: image.url,
				} ),
			] );
		},
		[ onInsert ]
	);
	return (
		<>
			<ImageExplorerButton />
			<InserterListbox>
				{ /* // TODO: styling here needs to be handled better */ }
				<div className="block-editor-inserter__panel-content__images">
					{ /* // TODO: check what to show as initial results.  */ }
					<ImageResults
						search="nba"
						pageSize={ 10 }
						rootClientId={ rootClientId }
						onClick={ onClick }
					/>
				</div>
			</InserterListbox>
		</>
	);
}
