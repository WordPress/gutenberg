/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';
import { count as wordCount } from '@wordpress/wordcount';

function MultiSelectionInspector( { blocks } ) {
	return sprintf( __( '%d words, %d blocks.' ), wordCount( serialize( blocks ), 'words' ), blocks.length );
}

export default withSelect( ( select ) => {
	const { getMultiSelectedBlocks } = select( 'core/editor' );
	return {
		blocks: getMultiSelectedBlocks(),
	};
} )( MultiSelectionInspector );
