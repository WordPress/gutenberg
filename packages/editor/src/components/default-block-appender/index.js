/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { getDefaultBlockName } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
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
	rootClientId,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = decodeEntities( placeholder ) || __( 'Write your story' );

	// The appender "button" is in-fact a text field so as to support
	// transitions by WritingFlow occurring by arrow key press. WritingFlow
	// only supports tab transitions into text fields and to the block focus
	// boundary.
	//
	// See: https://github.com/WordPress/gutenberg/issues/4829#issuecomment-374213658
	//
	// If it were ever to be made to be a proper `button` element, it is
	// important to note that `onFocus` alone would not be sufficient to
	// capture click events, notably in Firefox.
	//
	// See: https://gist.github.com/cvrebert/68659d0333a578d75372

	return (
		<div data-root-client-id={ rootClientId || '' } className="editor-default-block-appender">
			<BlockDropZone rootClientId={ rootClientId } layout={ layout } />
			<input
				role="button"
				aria-label={ __( 'Add block' ) }
				className="editor-default-block-appender__content"
				type="text"
				readOnly
				onFocus={ onAppend }
				value={ showPrompt ? value : '' }
			/>
			<InserterWithShortcuts rootClientId={ rootClientId } layout={ layout } />
			<Inserter position="top right" />
		</div>
	);
}
export default compose(
	withSelect( ( select, ownProps ) => {
		const { getBlockCount, getBlock, getEditorSettings, getTemplateLock } = select( 'core/editor' );

		const isEmpty = ! getBlockCount( ownProps.rootClientId );
		const lastBlock = getBlock( ownProps.lastBlockClientId );
		const isLastBlockDefault = get( lastBlock, [ 'name' ] ) === getDefaultBlockName();
		const isLastBlockValid = get( lastBlock, [ 'isValid' ] );
		const { bodyPlaceholder } = getEditorSettings();

		return {
			isVisible: isEmpty || ! isLastBlockDefault || ! isLastBlockValid,
			showPrompt: isEmpty,
			isLocked: !! getTemplateLock( ownProps.rootClientId ),
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
				const { layout, rootClientId } = ownProps;

				let attributes;
				if ( layout ) {
					attributes = { layout };
				}

				insertDefaultBlock( attributes, rootClientId );
				startTyping();
			},
		};
	} ),
)( DefaultBlockAppender );
