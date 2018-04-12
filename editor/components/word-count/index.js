/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { WordCounter } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { getBlocks } from '../../store/selectors';

function WordCount( { content } ) {
	// const wordCount = wp.utils.WordCounter.prototype.count( content );
	const wordCount = WordCounter.prototype.count( content );
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
