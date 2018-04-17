/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { WordCounter } from '@wordpress/utils';
import { withSelect } from '@wordpress/data';

function WordCount( { content } ) {
	const wordCount = WordCounter.prototype.count( content );
	return (
		<span className="word-count">{ wordCount }</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: serialize( select( 'core/editor' ).getBlocks() ),
	};
} )( WordCount );
