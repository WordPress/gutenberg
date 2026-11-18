import { useEffect } from '@wordpress/element';

interface ScrollSide {
	frame: HTMLIFrameElement;
	// Where this side was last scrolled to by the other, or -1.
	echo: number;
}

const isNear = ( a: number, b: number ) => Math.abs( a - b ) < 1;

function getScroller( { frame }: ScrollSide ) {
	return frame.contentDocument?.scrollingElement ?? null;
}

function getScrollRange( scroller: Element ) {
	return scroller.scrollHeight - scroller.clientHeight;
}

/**
 * Scrolls `target` to the same relative position as `source`.
 *
 * @param source The side that was scrolled.
 * @param target The side to follow it.
 */
function follow( source: ScrollSide, target: ScrollSide ) {
	const from = getScroller( source );
	const to = getScroller( target );
	if ( ! from || ! to ) {
		return;
	}

	// A programmatic scroll fires its own `scroll` event a frame later. Each
	// side remembers where it was scrolled to and ignores that echo, or the
	// two would drag each other back and forth.
	const top = from.scrollTop;
	const isEcho = isNear( top, source.echo );
	source.echo = -1;
	if ( isEcho ) {
		return;
	}

	// The two previews render different styles, so their heights differ:
	// they're kept at the same fraction of their scroll range, not the same
	// offset.
	const fromRange = getScrollRange( from );
	const next = fromRange > 0 ? ( top / fromRange ) * getScrollRange( to ) : 0;
	if ( isNear( to.scrollTop, next ) ) {
		return;
	}

	// `instant` overrides a theme's `scroll-behavior: smooth`, which would
	// animate every sync.
	to.scrollTo( { top: next, behavior: 'instant' } );
	target.echo = to.scrollTop;
}

/**
 * Listens for scrolling in one side's document and has the other follow.
 *
 * @param side  The side to listen to.
 * @param other The side to follow it.
 * @return A function that stops listening.
 */
function listen( side: ScrollSide, other: ScrollSide ) {
	// The root scroller fires `scroll` on the document, which bubbles to the
	// window.
	const onScroll = ( event: Event ) => {
		if ( event.target === side.frame.contentDocument ) {
			follow( side, other );
		}
	};

	// The frame's window is only ready once its document has loaded, which
	// may be before or after the frame reaches this hook.
	let view: Window | null = null;
	const attach = () => {
		view?.removeEventListener( 'scroll', onScroll );
		view = side.frame.contentWindow;
		view?.addEventListener( 'scroll', onScroll, { passive: true } );
	};
	attach();
	side.frame.addEventListener( 'load', attach );

	return () => {
		side.frame.removeEventListener( 'load', attach );
		view?.removeEventListener( 'scroll', onScroll );
	};
}

/**
 * Keeps two iframes scrolled to the same relative position, so their
 * documents can be compared as either is scrolled.
 *
 * @param first  The first iframe, or null to not sync.
 * @param second The second iframe, or null to not sync.
 */
export default function useSyncedScroll(
	first: HTMLIFrameElement | null,
	second: HTMLIFrameElement | null
) {
	useEffect( () => {
		if ( ! first || ! second ) {
			return;
		}

		const firstSide = { frame: first, echo: -1 };
		const secondSide = { frame: second, echo: -1 };
		const stopFirst = listen( firstSide, secondSide );
		const stopSecond = listen( secondSide, firstSide );

		return () => {
			stopFirst();
			stopSecond();
		};
	}, [ first, second ] );
}
