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
import './style.scss';

const modalName = 'edit-post/keyboard-shortcut-help';

const splitShortcutKey = ( shortcutKey ) => {
	return shortcutKey
		.split( /(\+|⌘)/ )
		.filter( ( character ) => !! character )
		.map( ( character, index ) => {
			if ( character !== '+' ) {
				return (
					<kbd
						key={ index }
						className="edit-post-keyboard-shortcut-help__shortcut-key"
					>
						{ character }
					</kbd>
				);
			}

			return (
				<Fragment key={ index }>
					{ character }
				</Fragment>
			);
		} );
};

const ShortcutList = ( { shortcuts } ) => (
	<dl className="edit-post-keyboard-shortcut-help__shortcut-list">
		{ shortcuts.map( ( { key, description }, index ) => (
			<div
				className="edit-post-keyboard-shortcut-help__shortcut"
				key={ index }
			>
				<dt className="edit-post-keyboard-shortcut-help__shortcut-term">
					<kbd className="edit-post-keyboard-shortcut-help__shortcut-key-combination">
						{ splitShortcutKey( key ) }
					</kbd>
				</dt>
				<dd className="edit-post-keyboard-shortcut-help__shortcut-description">
					{ description }
				</dd>
			</div>
		) ) }
	</dl>
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
	const title = (
		<span className="edit-post-keyboard-shortcut-help__title">
			{ __( 'Keyboard Shortcuts' ) }
		</span>
	);

	return (
		<Fragment>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ rawShortcut.primary( '/' ) ]: toggleModal,
				} }
			/>
			{ isModalActive && (
				<Modal
					className="edit-post-keyboard-shortcut-help"
					title={ title }
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
		isModalActive: select( 'core/edit-post' ).isModalActive( modalName ),
	} ) ),
	withDispatch( ( dispatch, { isModalActive } ) => {
		const {
			openModal,
			closeModal,
		} = dispatch( 'core/edit-post' );

		return {
			toggleModal: ( ) => isModalActive ? closeModal() : openModal( modalName ),
		};
	} ),
] )( KeyboardShortcutHelpModal );
