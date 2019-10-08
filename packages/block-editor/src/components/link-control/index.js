/**
 * WordPress dependencies
 */
import {
	IconButton,
	MenuItem,
	NavigableMenu,
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
	URLInput,
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

	// Render Components
	const renderSearchResults = () => (
		<div className="link-control__search-results">
			<NavigableMenu>

				<MenuItem
					className="link-control__search-item"
					key="some-key-here"
					icon={ 'wordpress' }
					info="make.wordpress.com"
					onClick={ () => {
						// do things
					} }
				>
					<span>WordPress!</span>
					<span className="link-control__search-item-type">URL</span>
				</MenuItem>
				<MenuItem
					className="link-control__search-item"
					key="some-other-key-here"
					icon={ 'admin-page' }
					info="2 days ago"
					onClick={ () => {
						// do things
					} }
				>
					<span>Hello World</span>
					<span className="link-control__search-item-type">Page</span>
				</MenuItem>

			</NavigableMenu>
		</div>
	);

	const shouldRenderSearchResults = !! inputValue;

	return (
		<Fragment>
			<IconButton
				icon="insert"
				className="components-toolbar__control"
				label={ __( 'Insert link' ) }
				onClick={ openLinkUI }
			/>

			{ isOpen && (

				<URLPopover
					additionalControls={ shouldRenderSearchResults && renderSearchResults() }
				>
					<div className="link-control__popover-inner">
						<div className="link-control__search">

							<form
								onSubmit={ onSubmitLinkChange }
							>

								<URLInput
									className="link-control__search-input"
									value={ inputValue }
									onChange={ onInputChange }
									autocompleteRef={ autocompleteRef }
									onKeyDown={ stopPropagationRelevantKeys }
									onKeyPress={ stopPropagation }
									placeholder={ __( 'Search or type url' ) }
								/>
								<IconButton
									className="screen-reader-text"
									icon="editor-break"
									label={ __( 'Apply' ) }
									type="submit"
								/>
								<IconButton
									type="reset"
									label={ __( 'Reset' ) }
									icon="no-alt"
									className="link-control__search-reset"
									onClick={ () => onInputChange() }
								/>
							</form>
						</div>
					</div>
				</URLPopover>

			) }
		</Fragment>
	);
}

export default LinkControl;
