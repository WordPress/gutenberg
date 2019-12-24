/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Modal, KeyboardShortcuts } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rawShortcut } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { globalShortcuts, mainShortcuts, textFormattingShortcuts } from './config';
import Shortcut from './shortcut';
import DynamicShortcut from './dynamic-shortcut';

const MODAL_NAME = 'edit-post/keyboard-shortcut-help';

const ShortcutList = ( { shortcuts } ) => (
	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	<ul className="edit-post-keyboard-shortcut-help-modal__shortcut-list" role="list">
		{ shortcuts.map( ( shortcut, index ) => (
			<li
				className="edit-post-keyboard-shortcut-help-modal__shortcut"
				key={ index }
			>
				{ isString( shortcut ) ?
					<DynamicShortcut name={ shortcut } /> :
					<Shortcut { ...shortcut } />
				}
			</li>
		) ) }
	</ul>
	/* eslint-enable jsx-a11y/no-redundant-roles */
);

const ShortcutSection = ( { title, shortcuts, className } ) => (
	<section className={ classnames( 'edit-post-keyboard-shortcut-help-modal__section', className ) }>
		{ !! title && (
			<h2 className="edit-post-keyboard-shortcut-help-modal__section-title">
				{ title }
			</h2>
		) }
		<ShortcutList shortcuts={ shortcuts } />
	</section>
);

export function KeyboardShortcutHelpModal( { isModalActive, toggleModal } ) {
	return (
		<Fragment>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ rawShortcut.access( 'h' ) ]: toggleModal,
				} }
			/>
			{ isModalActive && (
				<Modal
					className="edit-post-keyboard-shortcut-help-modal"
					title={ __( 'Keyboard shortcuts' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ toggleModal }
				>
					<ShortcutSection
						className="edit-post-keyboard-shortcut-help-modal__main-shortcuts"
						shortcuts={ mainShortcuts }
					/>
					<ShortcutSection
						title={ __( 'Global shortcuts' ) }
						shortcuts={ globalShortcuts }
					/>
					<ShortcutSection
						title={ __( 'Selection shortcuts' ) }
						shortcuts={ [
							'core/block-editor/select-all',
							'core/block-editor/unselect',
						] }
					/>
					<ShortcutSection
						title={ __( 'Block shortcuts' ) }
						shortcuts={ [
							'core/block-editor/duplicate',
							'core/block-editor/remove',
							'core/block-editor/insert-before',
							'core/block-editor/insert-after',
							{
								keyCombination: '/',
								description: __( 'Change the block type after adding a new paragraph.' ),
								/* translators: The forward-slash character. e.g. '/'. */
								ariaLabel: __( 'Forward-slash' ),
							},
						] }
					/>
					<ShortcutSection
						title={ __( 'Text formatting' ) }
						shortcuts={ textFormattingShortcuts }
					/>
				</Modal>
			) }
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isModalActive: select( 'core/edit-post' ).isModalActive( MODAL_NAME ),
	} ) ),
	withDispatch( ( dispatch, { isModalActive } ) => {
		const {
			openModal,
			closeModal,
		} = dispatch( 'core/edit-post' );

		return {
			toggleModal: () => isModalActive ? closeModal() : openModal( MODAL_NAME ),
		};
	} ),
] )( KeyboardShortcutHelpModal );
