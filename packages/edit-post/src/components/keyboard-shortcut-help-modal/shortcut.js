/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
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
		<kbd
			className="edit-post-keyboard-shortcut-help-modal__shortcut-key-combination"
			aria-label={ forceAriaLabel || ariaLabel }
		>
			{ castArray( shortcut ).map( ( character, index ) => {
				if ( character === '+' ) {
					return <Fragment key={ index }>{ character }</Fragment>;
				}

				return (
					<kbd
						key={ index }
						className="edit-post-keyboard-shortcut-help-modal__shortcut-key"
					>
						{ character }
					</kbd>
				);
			} ) }
		</kbd>
	);
}

function Shortcut( { description, keyCombination, aliases = [], ariaLabel } ) {
	return (
		<>
			<div className="edit-post-keyboard-shortcut-help-modal__shortcut-description">
				{ description }
			</div>
			<div className="edit-post-keyboard-shortcut-help-modal__shortcut-term">
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
