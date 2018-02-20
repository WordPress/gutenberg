/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { appendDefaultBlock, startTyping } from '../../store/actions';
import { getBlock, getBlockCount } from '../../store/selectors';

export function DefaultBlockAppender( { isVisible, onAppend, showPrompt } ) {
	if ( ! isVisible ) {
		return null;
	}

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
	( state, ownProps ) => {
		const isEmpty = ! getBlockCount( state, ownProps.rootUID );
		const lastBlock = getBlock( state, ownProps.lastBlockUID );
		const isLastBlockDefault = get( lastBlock, 'name' ) === getDefaultBlockName();

		return {
			isVisible: isEmpty || ! isLastBlockDefault,
			showPrompt: isEmpty,
		};
	},
	( dispatch, ownProps ) => ( {
		onAppend() {
			const { layout, rootUID } = ownProps;

			let attributes;
			if ( layout ) {
				attributes = { layout };
			}

			dispatch( appendDefaultBlock( attributes, rootUID ) );
			dispatch( startTyping() );
		},
	} ),
)( DefaultBlockAppender );
