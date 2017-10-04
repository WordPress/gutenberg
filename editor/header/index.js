/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { sprintf, _n, __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import SavedState from './saved-state';
import PublishButton from './publish-button';
import PreviewButton from './preview-button';
import ModeSwitcher from './mode-switcher';
import Inserter from '../inserter';
import { getMultiSelectedBlockUids, hasEditorUndo, hasEditorRedo, isEditorSidebarOpened } from '../selectors';
import { clearSelectedBlock } from '../actions';

function Header( {
	multiSelectedBlockUids,
	onRemove,
	onDeselect,
	undo,
	redo,
	hasRedo,
	hasUndo,
	toggleSidebar,
	isSidebarOpened,
} ) {
	const count = multiSelectedBlockUids.length;

	if ( count ) {
		return (
			<div
				role="region"
				aria-label={ __( 'Editor toolbar' ) }
				className="editor-header editor-header-multi-select"
			>
				<div className="editor-selected-count">
					{ sprintf( _n( '%d block selected', '%d blocks selected', count ), count ) }
				</div>
				<div className="editor-selected-delete">
					<IconButton
						icon="trash"
						label={ __( 'Delete selected blocks' ) }
						onClick={ () => onRemove( multiSelectedBlockUids ) }
						focus={ true }
					>
						{ __( 'Delete' ) }
					</IconButton>
				</div>
				<div className="editor-selected-clear">
					<IconButton
						icon="no"
						label={ __( 'Clear selected blocks' ) }
						onClick={ () => onDeselect() }
					/>
				</div>
			</div>
		);
	}

	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
		>
			<div className="editor-header__content-tools">
				<Inserter position="bottom right" />
				<IconButton
					icon="undo"
					label={ __( 'Undo' ) }
					disabled={ ! hasUndo }
					onClick={ undo } />
				<IconButton
					icon="redo"
					label={ __( 'Redo' ) }
					disabled={ ! hasRedo }
					onClick={ redo } />
			</div>
			<div className="editor-header__settings">
				<SavedState />
				<PreviewButton />
				<PublishButton />
				<IconButton
					icon="admin-generic"
					onClick={ toggleSidebar }
					isToggled={ isSidebarOpened }
					label={ __( 'Settings' ) }
				/>
				<ModeSwitcher />
			</div>
		</div>
	);
}

export default connect(
	( state ) => ( {
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		hasUndo: hasEditorUndo( state ),
		hasRedo: hasEditorRedo( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		onDeselect: () => dispatch( clearSelectedBlock() ),
		onRemove: ( uids ) => dispatch( {
			type: 'REMOVE_BLOCKS',
			uids,
		} ),
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( Header );
