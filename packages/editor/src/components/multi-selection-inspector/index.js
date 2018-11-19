/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';
import { count as wordCount } from '@wordpress/wordcount';
import {
	Path,
	SVG,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import BlockIcon from '../block-icon';

function MultiSelectionInspector( { blocks } ) {
	return (
		<div className="editor-block-inspector__card">
			<BlockIcon icon={
				<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z" /></SVG>
			} showColors />
			<div className="editor-block-inspector__card-content">
				<div className="editor-block-inspector__card-title">
					{ sprintf( __( '%d blocks' ), blocks.length ) }
				</div>
				<div className="editor-block-inspector__card-description">
					{ sprintf( __( '%d words.' ), wordCount( serialize( blocks ), 'words' ) ) }
				</div>
			</div>
		</div>
	);
}

export default withSelect( ( select ) => {
	const { getMultiSelectedBlocks } = select( 'core/editor' );
	return {
		blocks: getMultiSelectedBlocks(),
	};
} )( MultiSelectionInspector );
