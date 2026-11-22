import { KeyboardShortcut } from '@wordpress/ui';

/**
 * @typedef {import('react').ComponentProps<typeof KeyboardShortcut>['keyCombination']} KeyCombination
 */

/**
 * @param {Object}           props                Component props.
 * @param {string}           props.description    Description of the shortcut action.
 * @param {KeyCombination}   props.keyCombination Primary shortcut.
 * @param {KeyCombination[]} [props.aliases]      Alternative shortcuts.
 * @param {string}           [props.ariaLabel]    Custom readable shortcut label.
 */
function Shortcut( { description, keyCombination, aliases = [], ariaLabel } ) {
	return (
		<>
			<div className="edit-widgets-keyboard-shortcut-help-modal__shortcut-description">
				{ description }
			</div>
			<div className="edit-widgets-keyboard-shortcut-help-modal__shortcut-term">
				<KeyboardShortcut
					keyCombination={ keyCombination }
					label={ ariaLabel }
					className="edit-widgets-keyboard-shortcut-help-modal__shortcut-key-combination"
					keyClassName="edit-widgets-keyboard-shortcut-help-modal__shortcut-key"
				/>
				{ aliases.map( ( alias, index ) => (
					<KeyboardShortcut
						keyCombination={ alias }
						label={ ariaLabel }
						className="edit-widgets-keyboard-shortcut-help-modal__shortcut-key-combination"
						keyClassName="edit-widgets-keyboard-shortcut-help-modal__shortcut-key"
						key={ index }
					/>
				) ) }
			</div>
		</>
	);
}

export default Shortcut;
