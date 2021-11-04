/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useState, createPortal } from '@wordpress/element';
import { ENTER, SPACE, ESCAPE } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';

/**
 * Embeds the given children in shadow DOM that has the same styling as the top
 * window (admin). A button is returned to allow the keyboard user to enter this
 * context. Visually, it appears inline, but it is styled as the admin, not as
 * the editor content.
 *
 * @param {Object} props Button props.
 *
 * @return {WPComponent} A button to enter the embedded admin context.
 */
export default function EmbeddedAdminContext( props ) {
	const [ shadow, setShadow ] = useState();
	const [ hasFocus, setHasFocus ] = useState();
	const ref = useRefEffect( ( element ) => {
		const root = element.attachShadow( { mode: 'open' } );

		// Copy all admin styles to the shadow DOM.
		const style = document.createElement( 'style' );
		Array.from( document.styleSheets ).forEach( ( styleSheet ) => {
			// Technically, it's fine to include this, but these are styles that
			// target other components, so there's performance gain in not
			// including them. Below, we use `StyleProvider` to render emotion
			// styles in shadow DOM.
			if ( styleSheet.ownerNode.getAttribute( 'data-emotion' ) ) {
				return;
			}

			// Try to avoid requests for stylesheets of which we already
			// know the CSS rules.
			try {
				let cssText = '';

				for ( const cssRule of styleSheet.cssRules ) {
					cssText += cssRule.cssText;
				}

				style.textContent += cssText;
			} catch ( e ) {
				root.appendChild( styleSheet.ownerNode.cloneNode( true ) );
			}
		} );
		root.appendChild( style );
		setShadow( root );

		function onFocusIn() {
			setHasFocus( true );
		}

		function onFocusOut() {
			setHasFocus( false );
		}

		/**
		 * When pressing ENTER or SPACE on the wrapper (button), focus the first
		 * tabbable inside the shadow DOM.
		 *
		 * @param {KeyboardEvent} event The keyboard event.
		 */
		function onKeyDown( event ) {
			if ( element !== event.path[ 0 ] ) return;
			if ( event.keyCode !== ENTER && event.keyCode !== SPACE ) return;

			event.preventDefault();

			const [ firstTabbable ] = focus.tabbable.find( root );
			if ( firstTabbable ) firstTabbable.focus();
		}

		/**
		 * When pressing ESCAPE inside the shadow DOM, focus the wrapper
		 * (button).
		 *
		 * @param {KeyboardEvent} event The keyboard event.
		 */
		function onRootKeyDown( event ) {
			if ( event.keyCode !== ESCAPE ) return;

			root.host.focus();
			event.preventDefault();
		}

		let timeoutId;

		/**
		 * When clicking inside the shadow DOM, temporarily remove the ability
		 * to catch focus, so focus moves to a focusable parent.
		 * This is done so that when the user clicks inside a placeholder, the
		 * block receives focus, which can handle delete, enter, etc.
		 */
		function onMouseDown() {
			element.removeAttribute( 'tabindex' );
			timeoutId = setTimeout( () =>
				element.setAttribute( 'tabindex', '0' )
			);
		}

		root.addEventListener( 'focusin', onFocusIn );
		root.addEventListener( 'focusout', onFocusOut );
		root.addEventListener( 'keydown', onRootKeyDown );
		element.addEventListener( 'keydown', onKeyDown );
		element.addEventListener( 'mousedown', onMouseDown );
		return () => {
			root.removeEventListener( 'focusin', onFocusIn );
			root.removeEventListener( 'focusout', onFocusOut );
			root.removeEventListener( 'keydown', onRootKeyDown );
			element.removeEventListener( 'keydown', onKeyDown );
			element.removeEventListener( 'mousedown', onMouseDown );
			clearTimeout( timeoutId );
		};
	}, [] );
	const content = (
		<StyleProvider document={ { head: shadow } }>
			{ props.children }
		</StyleProvider>
	);

	return (
		<div
			{ ...props }
			ref={ ref }
			tabIndex={ 0 }
			role="button"
			aria-pressed={ hasFocus }
		>
			{ shadow && createPortal( content, shadow ) }
		</div>
	);
}
