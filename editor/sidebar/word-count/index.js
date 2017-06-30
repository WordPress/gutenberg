/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import PanelBody from 'components/panel/body';
import { getBlocks } from '../../selectors';
import { serialize } from 'blocks';

function WordCount( { content, stopRender } ) {
	const wordcount = ( stopRender ) ? __( 'Calculating...' ) : wp.utils.WordCounter.prototype.count( content );
	return (
		<PanelBody><strong>{ __( 'Word Count' ) }:</strong>{ wordcount }</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			content: serialize( getBlocks( state ) ),
			stopRender: ( 'undefined' === typeof wp.utils.WordCounter ),
		};
	},
)( WordCount );
