/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { getBlocks } from '../selectors';
import { serialize } from 'blocks';

function WordCount( { content } ) {
	const wordCount = wp.utils.WordCounter.prototype.count( content );
	return (
		<span className="word-count">{ wordCount }</span>
	);
}

export default connect(
	( state ) => {
		return {
			content: serialize( getBlocks( state ) ),
		};
	}
)( WordCount );
