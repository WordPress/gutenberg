/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { textFormattingShortcuts } from './config';
import Shortcut from './shortcut';
import DynamicShortcut from './dynamic-shortcut';

const ShortcutList = ( { shortcuts } ) => (
	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	<ul
		className="edit-widgets-keyboard-shortcut-help-modal__shortcut-list"
		role="list"
	>
		{ shortcuts.map( ( shortcut, index ) => (
			<li
				className="edit-widgets-keyboard-shortcut-help-modal__shortcut"
				key={ index }
			>
				{ isString( shortcut ) ? (
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
		className={ classnames(
			'edit-widgets-keyboard-shortcut-help-modal__section',
			className
		) }
	>
		{ !! title && (
			<h2 className="edit-widgets-keyboard-shortcut-help-modal__section-title">
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

export default function KeyboardShortcutHelpModal( {
	isModalActive,
	toggleModal,
} ) {
	useShortcut( 'core/edit-widgets/keyboard-shortcuts', toggleModal, {
		bindGlobal: true,
	} );

	if ( ! isModalActive ) {
		return null;
	}

	return (
		<Modal
			className="edit-widgets-keyboard-shortcut-help-modal"
			title={ __( 'Keyboard shortcuts' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ toggleModal }
		>
			<ShortcutSection
				className="edit-widgets-keyboard-shortcut-help-modal__main-shortcuts"
				shortcuts={ [ 'core/edit-widgets/keyboard-shortcuts' ] }
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
		</Modal>
	);
}
