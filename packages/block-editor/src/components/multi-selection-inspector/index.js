/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';
import { count as wordCount } from '@wordpress/wordcount';
import {
	Path,
	SVG,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function MultiSelectionInspector( { blocks } ) {
	const words = wordCount( serialize( blocks ), 'words' );

	return (
		<div className="editor-multi-selection-inspector__card block-editor-multi-selection-inspector__card">
			<BlockIcon icon={
				<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z" /></SVG>
			} showColors />
			<div className="editor-multi-selection-inspector__card-content block-editor-multi-selection-inspector__card-content">
				<div className="editor-multi-selection-inspector__card-title block-editor-multi-selection-inspector__card-title">
					{
						/* translators: %d: number of blocks */
						sprintf( _n( '%d block', '%d blocks', blocks.length ), blocks.length )
					}
				</div>
				<div className="editor-multi-selection-inspector__card-description block-editor-multi-selection-inspector__card-description">
					{
						/* translators: %d: number of words */
						sprintf( _n( '%d word', '%d words', words ), words )
					}
				</div>
			</div>
		</div>
	);
}

export default withSelect( ( select ) => {
	const { getMultiSelectedBlocks } = select( 'core/block-editor' );
	return {
		blocks: getMultiSelectedBlocks(),
	};
} )( MultiSelectionInspector );
