/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlocks } from '../selectors';
import { serialize } from 'blocks';

function WordCount( { content } ) {
	const wordCount = wp.utils.WordCounter.prototype.count( content );
	return (
		<div><strong>{ __( 'Word Count' ) }: </strong>{ wordCount }</div>
	);
}

export default connect(
	( state ) => {
		return {
			content: serialize( getBlocks( state ) ),
		};
	}
)( WordCount );
