/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { getDefaultBlockName } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/utils';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import InserterWithShortcuts from '../inserter-with-shortcuts';
import Inserter from '../inserter';

export function DefaultBlockAppender( {
	isLocked,
	isVisible,
	onAppend,
	showPrompt,
	placeholder,
	layout,
	rootUID,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = decodeEntities( placeholder ) || __( 'Write your story' );

	return (
		<div
			data-root-uid={ rootUID || '' }
			className="editor-default-block-appender">
			<BlockDropZone rootUID={ rootUID } layout={ layout } />
			<input
				role="button"
				aria-label={ __( 'Add block' ) }
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
	withSelect( ( select, ownProps ) => {
		const {
			getBlockCount,
			getBlock,
			getEditorSettings,
		} = select( 'core/editor' );
		const isEmpty = ! getBlockCount( ownProps.rootUID );
		const lastBlock = getBlock( ownProps.lastBlockUID );
		const isLastBlockDefault = get( lastBlock, [ 'name' ] ) === getDefaultBlockName();
		const { templateLock, bodyPlaceholder } = getEditorSettings();

		return {
			isVisible: isEmpty || ! isLastBlockDefault,
			showPrompt: isEmpty,
			isLocked: !! templateLock,
			placeholder: bodyPlaceholder,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			insertDefaultBlock,
			startTyping,
		} = dispatch( 'core/editor' );
		return {
			onAppend() {
				const { layout, rootUID } = ownProps;

				let attributes;
				if ( layout ) {
					attributes = { layout };
				}

				insertDefaultBlock( attributes, rootUID );
				startTyping();
			},
		};
	} ),
)( DefaultBlockAppender );
