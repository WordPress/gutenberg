/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

function Shortcut( { description, keyCombination, ariaLabel } ) {
	return (
		<>
			<div className="edit-post-keyboard-shortcut-help-modal__shortcut-description">
				{ description }
			</div>
			<div className="edit-post-keyboard-shortcut-help-modal__shortcut-term">
				<kbd className="edit-post-keyboard-shortcut-help-modal__shortcut-key-combination" aria-label={ ariaLabel }>
					{ castArray( keyCombination ).map( ( character, index ) => {
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
								className="edit-post-keyboard-shortcut-help-modal__shortcut-key"
							>
								{ character }
							</kbd>
						);
					} ) }
				</kbd>
			</div>
		</>
	);
}

export default Shortcut;
