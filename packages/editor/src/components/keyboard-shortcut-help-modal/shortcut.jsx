import { VisuallyHidden } from '@wordpress/ui';
import { Fragment } from '@wordpress/element';
import { displayShortcutList, shortcutAriaLabel } from '@wordpress/keycodes';

function KeyCombination( { keyCombination, forceAriaLabel } ) {
	const shortcut = keyCombination.modifier
		? displayShortcutList[ keyCombination.modifier ](
				keyCombination.character
			)
		: keyCombination.character;
	const ariaLabel = keyCombination.modifier
		? shortcutAriaLabel[ keyCombination.modifier ](
				keyCombination.character
			)
		: keyCombination.character;

	return (
		<kbd className="editor-keyboard-shortcut-help-modal__shortcut-key-combination">
			<VisuallyHidden render={ <span /> }>
				{ forceAriaLabel || ariaLabel }
			</VisuallyHidden>
			<span aria-hidden="true">
				{ ( Array.isArray( shortcut ) ? shortcut : [ shortcut ] ).map(
					( character, index ) => {
						if ( character === '+' ) {
							return (
								<Fragment key={ index }>{ character }</Fragment>
							);
						}

						return (
							<kbd
								key={ index }
								className="editor-keyboard-shortcut-help-modal__shortcut-key"
							>
								{ character }
							</kbd>
						);
					}
				) }
			</span>
		</kbd>
	);
}

/**
 * @typedef {{ character: string, modifier?: import('@wordpress/keycodes').WPKeycodeModifier }} KeyCombination
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
			<div className="editor-keyboard-shortcut-help-modal__shortcut-description">
				{ description }
			</div>
			<div className="editor-keyboard-shortcut-help-modal__shortcut-term">
				<KeyCombination
					keyCombination={ keyCombination }
					forceAriaLabel={ ariaLabel }
				/>
				{ aliases.map( ( alias, index ) => (
					<KeyCombination
						keyCombination={ alias }
						forceAriaLabel={ ariaLabel }
						key={ index }
					/>
				) ) }
			</div>
		</>
	);
}

export default Shortcut;
