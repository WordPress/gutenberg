/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { appendDefaultBlock } from '../../store/actions';

export function DefaultBlockAppender( { onAppend, showPrompt = true } ) {
	return (
		<div className="editor-default-block-appender">
			<BlockDropZone />
			<input
				className="editor-default-block-appender__content"
				type="text"
				readOnly
				onFocus={ onAppend }
				onClick={ onAppend }
				onKeyDown={ onAppend }
				value={ showPrompt ? __( 'Write your story' ) : '' }
			/>
		</div>
	);
}

export default connect(
	null,
	( dispatch, ownProps ) => ( {
		onAppend() {
			const { layout, rootUID } = ownProps;

			let attributes;
			if ( layout ) {
				attributes = { layout };
			}

			dispatch( appendDefaultBlock( attributes, rootUID ) );
		},
	} ),
)( DefaultBlockAppender );
