/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { count as wordCount } from '@wordpress/wordcount';

function WordCount( { content } ) {
	return (
		<span className="word-count">{ wordCount( content, _x( 'words', 'Word count type. Do not translate!' ) ) }</span>
	);
}

export default withSelect( ( select ) => {
	return {
		content: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	};
} )( WordCount );
