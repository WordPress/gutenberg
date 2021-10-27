/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useState, createPortal } from '@wordpress/element';
import { ENTER, SPACE, ESCAPE } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';

export default function EmbeddedAdminContext( props ) {
	const [ shadow, setShadow ] = useState();
	const [ hasFocus, setHasFocus ] = useState();
	const ref = useRefEffect( ( element ) => {
		const root = element.attachShadow( { mode: 'open' } );
		const style = document.createElement( 'style' );
		Array.from( document.styleSheets ).forEach( ( styleSheet ) => {
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

		function onKeyDown( event ) {
			if ( element !== event.path[ 0 ] ) return;

			if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
				focus.focusable.find( root )[ 0 ].focus();
				event.preventDefault();
			} else if ( event.keyCode === ESCAPE ) {
				root.host.focus();
				event.preventDefault();
				event.stopPropagation();
			}
		}

		root.addEventListener( 'focusin', onFocusIn );
		root.addEventListener( 'focusout', onFocusOut );
		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			root.addEventListener( 'focusin', onFocusIn );
			root.addEventListener( 'focusout', onFocusOut );
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
	return (
		<div
			{ ...props }
			ref={ ref }
			tabIndex={ 0 }
			role="button"
			aria-pressed={ hasFocus }
		>
			{ shadow &&
				createPortal(
					<StyleProvider document={ { head: shadow } }>
						{ props.children }
					</StyleProvider>,
					shadow
				) }
		</div>
	);
}
