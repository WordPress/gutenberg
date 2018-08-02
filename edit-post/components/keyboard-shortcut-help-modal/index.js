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
						className="editor-keyboard-shortcut-help__shortcut-key"
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
	<dl className="editor-keyboard-shortcut-help__shortcut-list">
		{ shortcuts.map( ( { key, description }, index ) => (
			<div
				className="editor-keyboard-shortcut-help__shortcut"
				key={ index }
			>
				<dt className="editor-keyboard-shortcut-help__shortcut-term">
					<kbd className="editor-keyboard-shortcut-help__shortcut-key-combination">
						{ splitShortcutKey( key ) }
					</kbd>
				</dt>
				<dd className="editor-keyboard-shortcut-help__shortcut-description">
					{ description }
				</dd>
			</div>
		) ) }
	</dl>
);

const ShortcutSection = ( { title, shortcuts } ) => (
	<section className="editor-keyboard-shortcut-help__section">
		<h2 className="editor-keyboard-shortcut-help__section-title">
			{ title }
		</h2>
		<ShortcutList shortcuts={ shortcuts } />
	</section>
);

export function KeyboardShortcutHelpModal( props ) {
	return (
		<Fragment>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ rawShortcut.primary( '/' ) ]: props.toggleModal,
				} }
			/>
			{ props.isModalActive && (
				<Modal
					className="editor-keyboard-shortcut-help"
					title={ __( 'Keyboard Shortcuts' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ props.toggleModal }
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
