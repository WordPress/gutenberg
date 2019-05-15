/**
 * External dependencies
 */
import { castArray } from 'lodash';

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
import shortcutConfig from './config';

const MODAL_NAME = 'edit-post/keyboard-shortcut-help';

const mapKeyCombination = ( keyCombination ) => keyCombination.map( ( character, index ) => {
	if ( character === '+' ) {
		return (
			<Fragment key={ index }>
				{ character }
			</Fragment>
		);
	}

	return (
		<kbd
			key={ index }
			className="edit-post-keyboard-shortcut-help__shortcut-key"
		>
			{ character }
		</kbd>
	);
} );

const ShortcutList = ( { shortcuts } ) => (
	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	<ul className="edit-post-keyboard-shortcut-help__shortcut-list" role="list">
		{ shortcuts.map( ( { keyCombination, description, ariaLabel }, index ) => (
			<li
				className="edit-post-keyboard-shortcut-help__shortcut"
				key={ index }
			>
				<div className="edit-post-keyboard-shortcut-help__shortcut-description">
					{ description }
				</div>
				<div className="edit-post-keyboard-shortcut-help__shortcut-term">
					<kbd className="edit-post-keyboard-shortcut-help__shortcut-key-combination" aria-label={ ariaLabel }>
						{ mapKeyCombination( castArray( keyCombination ) ) }
					</kbd>
				</div>
			</li>
		) ) }
	</ul>
);

const ShortcutSection = ( { title, shortcuts } ) => (
	<section className="edit-post-keyboard-shortcut-help__section">
		<h2 className="edit-post-keyboard-shortcut-help__section-title">
			{ title }
		</h2>
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
					className="edit-post-keyboard-shortcut-help"
					title={ __( 'Keyboard Shortcuts' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ toggleModal }
				>
					{ shortcutConfig.map( ( config, index ) => (
						<ShortcutSection key={ index } { ...config } />
					) ) }
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
