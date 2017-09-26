/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getBlocks } from '../selectors';
import { serialize } from '../api';

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
