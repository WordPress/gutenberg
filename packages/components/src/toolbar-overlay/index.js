/**
 * External dependencies
 */
import { useTransition, animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

export default function ToolbarOverlay( {
	isOpen,
	close,
	popoverFactory,
	children,
	closeOnClickOutside = true,
} ) {
	const ref = useRef();
	const popoverRef = useRef();

	useEffect( () => {
		if ( ! closeOnClickOutside ) {
			return;
		}
		if ( ! isOpen ) {
			return;
		}

		const listener = function ( e ) {
			const urlToolbar = ref.current;
			const rootToolbar = findParent( urlToolbar, ( node ) =>
				node.classList.contains( 'block-editor-block-toolbar' )
			);
			const toolbar = rootToolbar || urlToolbar;
			const popover = popoverRef.current;
			if (
				toolbar !== e.target &&
				! toolbar?.contains( e.target ) &&
				popover !== e.target &&
				! popover?.contains( e.target )
			) {
				close();
			}
		};
		document.addEventListener( 'mousedown', listener );
		document.addEventListener( 'focus', listener, true );

		return function () {
			document.removeEventListener( 'mousedown', listener );
			document.removeEventListener( 'focus', listener, true );
		};
	}, [ isOpen ] );

	const transitions = useTransition( isOpen, null, {
		// from: { position: 'absolute', opacity: 0, left: '50%' },
		// enter: { opacity: 1, left: '0%', right: '0%' },
		// leave: { opacity: 0, left: '50%', right: '50%' },
	} );

	return transitions.map(
		( { item, key, props, state } ) =>
			item && (
				<div
					className="block-editor-block-toolbar__slot block-editor-block-toolbar__overlay"
					key={ key }
				>
					<animated.div
						style={ props }
						ref={ ref }
						className="block-editor-block-toolbar__overlay-content"
					>
						{ children }
					</animated.div>
					{ state !== 'leave' &&
						popoverFactory &&
						popoverFactory( popoverRef ) }
				</div>
			)
	);
}

const findParent = ( node, predicate ) => {
	while ( node && node !== document.body ) {
		if ( predicate( node ) ) {
			return node;
		}
		node = node.parentNode;
	}
	return null;
};
