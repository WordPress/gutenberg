/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from '../../components/button';

function PublishButton( { blocks, post, onUpdate, onPublish } ) {
	let buttonText, saveCallback;
	if ( post && post.id ) {
		buttonText = wp.i18n.__( 'Update' );
		saveCallback = onUpdate;
	} else {
		buttonText = wp.i18n.__( 'Publish' );
		saveCallback = onPublish;
	}

	return (
		<Button
			isPrimary
			isLarge
			onClick={ () => saveCallback( post, blocks ) }
		>
			{ buttonText }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		blocks: state.editor.blockOrder.map( ( uid ) => (
			state.editor.blocksByUid[ uid ]
		) ),
		post: state.editor.post,
	} ),
	( dispatch ) => ( {
		onUpdate( post, blocks ) {
			post.content.raw = wp.blocks.serialize( blocks );
			dispatch( {
				type: 'UPDATE_POST',
				post,
			} );
		},
		onPublish( post, blocks ) {
			post.content.raw = wp.blocks.serialize( blocks );
			post.status = 'publish'; // TODO draft first?
			dispatch( {
				type: 'PUBLISH_NEW_POST',
				post,
			} );
		},
	} )
)( PublishButton );
