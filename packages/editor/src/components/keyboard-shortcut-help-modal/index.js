/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { textFormattingShortcuts } from './config';
import Shortcut from './shortcut';
import DynamicShortcut from './dynamic-shortcut';

const KEYBOARD_SHORTCUT_HELP_MODAL_NAME = 'editor/keyboard-shortcut-help';

const ShortcutList = ( { shortcuts } ) => (
	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	<ul
		className="editor-keyboard-shortcut-help-modal__shortcut-list"
		role="list"
	>
		{ shortcuts.map( ( shortcut, index ) => (
			<li
				className="editor-keyboard-shortcut-help-modal__shortcut"
				key={ index }
			>
				{ typeof shortcut === 'string' ? (
					<DynamicShortcut name={ shortcut } />
				) : (
					<Shortcut { ...shortcut } />
				) }
			</li>
		) ) }
	</ul>
	/* eslint-enable jsx-a11y/no-redundant-roles */
);

const ShortcutSection = ( { title, shortcuts, className } ) => (
	<section
		className={ clsx(
			'editor-keyboard-shortcut-help-modal__section',
			className
		) }
	>
		{ !! title && (
			<h2 className="editor-keyboard-shortcut-help-modal__section-title">
				{ title }
			</h2>
		) }
		<ShortcutList shortcuts={ shortcuts } />
	</section>
);

const ShortcutCategorySection = ( {
	title,
	categoryName,
	additionalShortcuts = [],
} ) => {
	const categoryShortcuts = useSelect(
		( select ) => {
			return select( keyboardShortcutsStore ).getCategoryShortcuts(
				categoryName
			);
		},
		[ categoryName ]
	);

	return (
		<ShortcutSection
			title={ title }
			shortcuts={ categoryShortcuts.concat( additionalShortcuts ) }
		/>
	);
};

function KeyboardShortcutHelpModal() {
	const isModalActive = useSelect(
		( select ) =>
			select( interfaceStore ).isModalActive(
				KEYBOARD_SHORTCUT_HELP_MODAL_NAME
			),
		[]
	);
	const { openModal, closeModal } = useDispatch( interfaceStore );
	const toggleModal = () => {
		if ( isModalActive ) {
			closeModal();
		} else {
			openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
		}
	};
	useShortcut( 'core/editor/keyboard-shortcuts', toggleModal );

	if ( ! isModalActive ) {
		return null;
	}

	return (
		<Modal
			className="editor-keyboard-shortcut-help-modal"
			title={ __( 'Keyboard shortcuts' ) }
			closeButtonLabel={ __( 'Close' ) }
			onRequestClose={ toggleModal }
		>
			<ShortcutSection
				className="editor-keyboard-shortcut-help-modal__main-shortcuts"
				shortcuts={ [ 'core/editor/keyboard-shortcuts' ] }
			/>
			<ShortcutCategorySection
				title={ __( 'Global shortcuts' ) }
				categoryName="global"
			/>

			<ShortcutCategorySection
				title={ __( 'Selection shortcuts' ) }
				categoryName="selection"
			/>

			<ShortcutCategorySection
				title={ __( 'Block shortcuts' ) }
				categoryName="block"
				additionalShortcuts={ [
					{
						keyCombination: { character: '/' },
						description: __(
							'Change the block type after adding a new paragraph.'
						),
						/* translators: The forward-slash character. e.g. '/'. */
						ariaLabel: __( 'Forward-slash' ),
					},
				] }
			/>
			<ShortcutSection
				title={ __( 'Text formatting' ) }
				shortcuts={ textFormattingShortcuts }
			/>
			<ShortcutCategorySection
				title={ __( 'List View shortcuts' ) }
				categoryName="list-view"
			/>
		</Modal>
	);
}

export default KeyboardShortcutHelpModal;
