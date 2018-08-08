/**
 * External dependencies
 */
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { getDefaultBlockName } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';
import { DotTip } from '@wordpress/nux';

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
	hasTip,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = decodeEntities( placeholder ) || __( 'Write your story' );

	return (
		<div
			data-root-client-id={ rootClientId || '' }
			className={ classnames( 'editor-default-block-appender', {
				'has-tip': hasTip,
			} ) }>
			<BlockDropZone rootClientId={ rootClientId } layout={ layout } />
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
			<InserterWithShortcuts rootClientId={ rootClientId } layout={ layout } />
			<Inserter position="top right">
				<DotTip id="core/editor.inserter">
					{ __( 'Welcome to the wonderful world of blocks! Click the “+” (“Add block”) button to add a new block. There are blocks available for all kind of content: you can insert text, headings, images, lists, and lots more!' ) }
				</DotTip>
			</Inserter>
		</div>
	);
}
export default compose(
	withSelect( ( select, ownProps ) => {
		const { getBlockCount, getBlock, getEditorSettings, getTemplateLock } = select( 'core/editor' );
		const { isTipVisible } = select( 'core/nux' );

		const isEmpty = ! getBlockCount( ownProps.rootClientId );
		const lastBlock = getBlock( ownProps.lastBlockClientId );
		const isLastBlockDefault = get( lastBlock, [ 'name' ] ) === getDefaultBlockName();
		const { bodyPlaceholder } = getEditorSettings();

		return {
			isVisible: isEmpty || ! isLastBlockDefault,
			showPrompt: isEmpty,
			isLocked: !! getTemplateLock( ownProps.rootClientId ),
			placeholder: bodyPlaceholder,
			hasTip: isTipVisible( 'core/editor.inserter' ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			insertDefaultBlock,
			startTyping,
		} = dispatch( 'core/editor' );

		const { dismissTip } = dispatch( 'core/nux' );

		return {
			onAppend() {
				const { layout, rootClientId, hasTip } = ownProps;

				let attributes;
				if ( layout ) {
					attributes = { layout };
				}

				insertDefaultBlock( attributes, rootClientId );
				startTyping();

				if ( hasTip ) {
					dismissTip( 'core/editor.inserter' );
				}
			},
		};
	} ),
)( DefaultBlockAppender );
