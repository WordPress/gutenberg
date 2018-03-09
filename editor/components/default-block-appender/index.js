/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { getDefaultBlockName } from '@wordpress/blocks';
import { withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { insertDefaultBlock, startTyping } from '../../store/actions';
import { getBlock, getBlockCount } from '../../store/selectors';
import InserterWithShortcuts from '../inserter-with-shortcuts';
import Inserter from '../inserter';

export function DefaultBlockAppender( { isLocked, isVisible, onAppend, showPrompt, placeholder, layout, rootUID } ) {
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
			<InserterWithShortcuts rootUID={ rootUID } layout={ layout } />
			<Inserter position="top right" />
		</div>
	);
}
export default compose(
	connect(
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
