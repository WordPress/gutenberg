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
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';

/**
 * Zero width non-breaking space, used as padding for the paragraph when it is
 * empty.
 */
const ZWNBSP = '\ufeff';

export function DefaultBlockAppender( {
	isLocked,
	isVisible,
	onAppend,
	showPrompt,
	placeholder,
	rootClientId,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value =
		decodeEntities( placeholder ) || __( 'Type / to choose a block' );

	return (
		<div
			data-root-client-id={ rootClientId || '' }
			className="block-editor-default-block-appender"
		>
			<p
				tabIndex="0"
				// We want this element to be styled as a paragraph by themes.
				// In
				// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
				role="button"
				aria-label={ __( 'Add block' ) }
				// The wp-block className is important for editor styles.
				className="wp-block block-editor-default-block-appender__content"
				onFocus={ onAppend }
			>
				{ showPrompt ? value : ZWNBSP }
			</p>
			<Inserter
				rootClientId={ rootClientId }
				position="bottom right"
				isAppender
				__experimentalIsQuick
			/>
		</div>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const {
			getBlockCount,
			getBlockName,
			isBlockValid,
			getSettings,
			getTemplateLock,
		} = select( blockEditorStore );

		const isEmpty = ! getBlockCount( ownProps.rootClientId );
		const isLastBlockDefault =
			getBlockName( ownProps.lastBlockClientId ) ===
			getDefaultBlockName();
		const isLastBlockValid = isBlockValid( ownProps.lastBlockClientId );
		const { bodyPlaceholder } = getSettings();

		return {
			isVisible: isEmpty || ! isLastBlockDefault || ! isLastBlockValid,
			showPrompt: isEmpty,
			isLocked: !! getTemplateLock( ownProps.rootClientId ),
			placeholder: bodyPlaceholder,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { insertDefaultBlock, startTyping } = dispatch(
			blockEditorStore
		);

		return {
			onAppend() {
				const { rootClientId } = ownProps;

				insertDefaultBlock( undefined, rootClientId );
				startTyping();
			},
		};
	} )
)( DefaultBlockAppender );
