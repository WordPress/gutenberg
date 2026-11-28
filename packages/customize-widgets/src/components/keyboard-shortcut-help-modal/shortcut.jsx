import { Fragment } from '@wordpress/element';
import { displayShortcutList, shortcutAriaLabel } from '@wordpress/keycodes';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * @typedef {Object} ShortcutKeyCombination
 * @property {string}                                                 character  Shortcut key.
 * @property {import('@wordpress/keycodes').WPKeycodeModifier | null} [modifier] Optional shortcut modifier.
 */

/**
 * @param {Object}                 props                Component props.
 * @param {ShortcutKeyCombination} props.keyCombination Shortcut to display.
 * @param {string}                 [props.ariaLabel]    Custom readable shortcut label.
 */
function KeyCombination( { keyCombination, ariaLabel } ) {
	const { character, modifier } = keyCombination;
	const normalizedModifier = modifier ?? 'undefined';
	const keys = displayShortcutList[ normalizedModifier ]( character );

	return (
		<kbd
			className="customize-widgets-keyboard-shortcut-help-modal__shortcut-key-combination"
			dir="ltr"
		>
			<VisuallyHidden render={ <span /> }>
				{ ariaLabel ||
					shortcutAriaLabel[ normalizedModifier ]( character ) }
			</VisuallyHidden>
			<span aria-hidden="true">
				{ keys.map( ( key, index ) =>
					key === '+' && index < keys.length - 1 ? (
						<Fragment key={ index }>{ key }</Fragment>
					) : (
						<kbd
							key={ index }
							className="customize-widgets-keyboard-shortcut-help-modal__shortcut-key"
						>
							{ key }
						</kbd>
					)
				) }
			</span>
		</kbd>
	);
}

/**
 * @param {Object}                   props                Component props.
 * @param {string}                   props.description    Description of the shortcut action.
 * @param {ShortcutKeyCombination}   props.keyCombination Primary shortcut.
 * @param {ShortcutKeyCombination[]} [props.aliases]      Alternative shortcuts.
 * @param {string}                   [props.ariaLabel]    Custom readable shortcut label.
 */
function Shortcut( { description, keyCombination, aliases = [], ariaLabel } ) {
	return (
		<>
			<div className="customize-widgets-keyboard-shortcut-help-modal__shortcut-description">
				{ description }
			</div>
			<div className="customize-widgets-keyboard-shortcut-help-modal__shortcut-term">
				<KeyCombination
					keyCombination={ keyCombination }
					ariaLabel={ ariaLabel }
				/>
				{ aliases.map( ( alias, index ) => (
					<KeyCombination
						keyCombination={ alias }
						ariaLabel={ ariaLabel }
						key={ index }
					/>
				) ) }
			</div>
		</>
	);
}

export default Shortcut;
