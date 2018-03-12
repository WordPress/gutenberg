/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { insertDefaultBlock, startTyping } from '../../store/actions';
import { getBlock, getBlockCount } from '../../store/selectors';

export function DefaultBlockAppender( { isLocked, isVisible, onAppend, showPrompt, placeholder } ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = placeholder || __( 'Write your story' );

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
				value={ showPrompt ? value : '' }
			/>
		</div>
	);
}
export default compose(
	connect(
		( state, ownProps ) => {
			const isEmpty = ! getBlockCount( state, ownProps.rootUID );
			const lastBlock = getBlock( state, ownProps.lastBlockUID );
			const isLastBlockEmptyDefault = lastBlock && isUnmodifiedDefaultBlock( lastBlock );

			return {
				isVisible: isEmpty || ! isLastBlockEmptyDefault,
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

				dispatch( insertDefaultBlock( attributes, rootUID ) );
				dispatch( startTyping() );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock, bodyPlaceholder } = settings;

		return {
			isLocked: !! templateLock,
			placeholder: bodyPlaceholder,
		};
	} ),
)( DefaultBlockAppender );
