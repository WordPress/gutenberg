/**
 * WordPress dependencies
 */
import {
	IconButton,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

import {
	useCallback,
	useState,
	useRef,
	Fragment,
} from '@wordpress/element';

import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	URLPopover,
} from '../';

function LinkControl( { defaultOpen = false } ) {
	// State
	const [ isOpen, setIsOpen ] = useState( defaultOpen );
	const [ inputValue, setInputValue ] = useState( '' );

	// Refs
	const autocompleteRef = useRef( null );

	// Effects
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	// Handlers
	const onInputChange = ( value = '' ) => {
		setInputValue( value );
	};

	const onSubmitLinkChange = ( value ) => {
		setInputValue( value );
	};

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	return (
		<Fragment>
			<IconButton
				icon="insert"
				className="components-toolbar__control"
				label={ __( 'Insert link' ) }
				onClick={ openLinkUI }
			/>

			{ isOpen && (

				<URLPopover>
					<div className="link-control__popover-inner">
						<div className="link-control__search">
							<URLPopover.LinkEditor
								className="link-control__search-input"
								value={ inputValue }
								onChangeInputValue={ onInputChange }
								onKeyDown={ stopPropagationRelevantKeys }
								onKeyPress={ stopPropagation }
								onSubmit={ onSubmitLinkChange }
								autocompleteRef={ autocompleteRef }
							/>
							<IconButton
								icon="no-alt"
								className="link-control__search-reset"
								label={ __( 'Reset url input' ) }
								onClick={ () => onInputChange() }
							/>
						</div>
					</div>
				</URLPopover>

			) }
		</Fragment>
	);
}

export default LinkControl;
