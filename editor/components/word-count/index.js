/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { withSelect } from '@wordpress/data';

function WordCount( { content } ) {
	const wordCount = wp.utils.WordCounter.prototype.count( content );
	return (
		<span className="word-count">{ wordCount }</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: serialize( select( 'core/editor' ).getBlocks() ),
	};
} )( WordCount );
