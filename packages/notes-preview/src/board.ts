/**
 * Keeps the review rail lined up with the post.
 *
 * Cards are placed in document space rather than viewport space, so they scroll
 * with the content they annotate and no scroll listener is needed. Only a
 * change in layout - a resize, a font loading, an image settling - can move an
 * anchor, and a ResizeObserver covers those.
 */

import { calculateThreadTops, parseNoteIds, type ThreadAnchor } from './layout';

const NOTE_BLOCK_SELECTOR = '[data-wp-note-id]';

/** Below this width the rail becomes a drawer and cards stop being aligned. */
export const FLOAT_BREAKPOINT = 1100;

export interface BoardHandle {
	measure: () => void;
	setSelected: ( id: string | null ) => void;
	scrollToAnchor: ( id: string ) => void;
	destroy: () => void;
}

/**
 * Finds the element a note points at.
 *
 * An inline note anchors to its own marker so the card lines up with the noted
 * words rather than the whole paragraph. A marker split across several runs
 * resolves to its first run. A block note has no marker and anchors to the
 * block itself.
 *
 * @param block  Block element carrying the note.
 * @param noteId Note ID.
 * @return The element to align against.
 */
function resolveAnchor( block: HTMLElement, noteId: string ): HTMLElement {
	const marker = block.querySelector< HTMLElement >(
		`mark.wp-note[data-id="${ noteId }"]`
	);

	return marker ?? block;
}

/**
 * Wires up the rail for a preview page.
 *
 * @param root     The `.wp-notes-preview` root element.
 * @param onSelect Called with a note ID when an indicator is activated.
 * @return Handle for driving and tearing down the board.
 */
export function createBoard(
	root: HTMLElement,
	onSelect: ( id: string ) => void
): BoardHandle {
	const boardEl = root.querySelector< HTMLElement >(
		'.wp-notes-preview__board'
	);
	const indicatorLayer = root.querySelector< HTMLElement >(
		'.wp-notes-preview__indicators'
	);

	let selectedId: string | null = null;
	let frame = 0;

	/** Anchor element for every note that has one, keyed by note ID. */
	const anchors = new Map< string, HTMLElement >();

	// Only threads on the aligned board take part in layout. Resolved threads
	// live in their own list and would otherwise push open threads off their
	// anchors.
	const cards = new Map< string, HTMLElement >();
	for ( const card of root.querySelectorAll< HTMLElement >(
		'.wp-notes-preview__board .wp-notes-preview__thread[data-note-id]'
	) ) {
		cards.set( card.dataset.noteId as string, card );
	}

	/**
	 * Builds one indicator per noted block, showing the avatars of the notes on
	 * it. The indicator lives in its own layer rather than inside the block, so
	 * no theme markup is touched.
	 */
	function buildIndicators(): void {
		if ( ! indicatorLayer ) {
			return;
		}

		indicatorLayer.replaceChildren();

		for ( const block of document.querySelectorAll< HTMLElement >(
			NOTE_BLOCK_SELECTOR
		) ) {
			const ids = parseNoteIds( block.dataset.wpNoteId ?? null );
			const known = ids.filter( ( id ) => cards.has( id ) );

			if ( ! known.length ) {
				continue;
			}

			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'wp-notes-preview__indicator';
			button.dataset.noteId = known[ 0 ];
			// Labels are rendered by PHP so they arrive translated; this module
			// carries no strings of its own.
			const template =
				known.length === 1
					? indicatorLayer.dataset.labelSingle ?? ''
					: indicatorLayer.dataset.labelPlural ?? '';

			button.setAttribute(
				'aria-label',
				template.replace( '%d', String( known.length ) )
			);

			for ( const id of known.slice( 0, 3 ) ) {
				const card = cards.get( id ) as HTMLElement;
				const avatar = document.createElement( 'span' );
				avatar.className = 'wp-notes-preview__indicator-avatar';
				avatar.style.backgroundImage = `url(${ card.dataset.authorAvatar })`;
				avatar.style.borderColor = card.dataset.authorColor as string;
				button.append( avatar );
			}

			if ( known.length > 3 ) {
				const overflow = document.createElement( 'span' );
				overflow.className = 'wp-notes-preview__indicator-overflow';
				overflow.textContent = `+${ known.length - 3 }`;
				button.append( overflow );
			}

			button.addEventListener( 'click', () =>
				onSelect( button.dataset.noteId as string )
			);

			indicatorLayer.append( button );
		}
	}

	/** Finds the anchor element for every note that has one. */
	function readAnchors(): void {
		anchors.clear();

		const remember = ( id: string, element: HTMLElement ): void => {
			if ( cards.has( id ) && ! anchors.has( id ) ) {
				anchors.set( id, element );
			}
		};

		for ( const block of document.querySelectorAll< HTMLElement >(
			NOTE_BLOCK_SELECTOR
		) ) {
			for ( const id of parseNoteIds( block.dataset.wpNoteId ?? null ) ) {
				remember( id, resolveAnchor( block, id ) );
			}
		}

		// An inline note whose block lost its `metadata.noteId` still has its
		// marker in the content, and the marker is the better anchor anyway.
		for ( const marker of document.querySelectorAll< HTMLElement >(
			'mark.wp-note[data-id]'
		) ) {
			remember( marker.dataset.id as string, marker );
		}
	}

	/** Measures where the anchors sit, in document space. */
	function anchorTops(): ThreadAnchor[] {
		const scrollY = window.scrollY;

		return Array.from( anchors, ( [ id, element ] ) => ( {
			id,
			top: element.getBoundingClientRect().top + scrollY,
		} ) );
	}

	/**
	 * Positions the indicators against their blocks.
	 *
	 * Both coordinates are set from the anchor's own box rather than from a
	 * CSS edge: an absolutely positioned element resolves against the viewport,
	 * which is the far side of the rail, and the right edge of the content
	 * column is where the indicator belongs.
	 */
	function placeIndicators(): void {
		if ( ! indicatorLayer ) {
			return;
		}

		const scrollX = window.scrollX;
		const scrollY = window.scrollY;

		for ( const button of indicatorLayer.querySelectorAll< HTMLElement >(
			'.wp-notes-preview__indicator'
		) ) {
			const anchor = anchors.get( button.dataset.noteId as string );

			if ( ! anchor ) {
				button.hidden = true;
				continue;
			}

			const block =
				anchor.closest< HTMLElement >( NOTE_BLOCK_SELECTOR ) ?? anchor;
			const rect = block.getBoundingClientRect();

			button.hidden = false;
			button.style.top = `${ rect.top + scrollY }px`;
			button.style.left = `${ rect.right + scrollX + 8 }px`;
		}
	}

	/** Re-reads the page and repositions everything. */
	function measure(): void {
		if ( ! boardEl ) {
			return;
		}

		// The admin bar is fixed to the top of the viewport and would otherwise
		// sit over the rail's header. Measured rather than assumed: its height
		// changes with the viewport and a theme may not show it at all.
		const adminBar = document.getElementById( 'wpadminbar' );
		root.style.setProperty(
			'--wp-notes-preview-admin-bar',
			`${ adminBar?.offsetHeight ?? 0 }px`
		);

		const floating = window.innerWidth >= FLOAT_BREAKPOINT;
		root.classList.toggle( 'is-floating', floating );

		readAnchors();

		// Threads whose block was deleted have nothing to line up with. They
		// stay in the rail, listed under their own heading, rather than
		// vanishing.
		for ( const [ id, card ] of cards ) {
			card.classList.toggle( 'is-unanchored', ! anchors.has( id ) );
		}

		placeIndicators();

		if ( ! floating ) {
			for ( const card of cards.values() ) {
				card.style.top = '';
			}
			boardEl.style.height = '';
			return;
		}

		const heights: Record< string, number > = {};
		for ( const [ id, card ] of cards ) {
			heights[ id ] = card.offsetHeight;
		}

		const tops = calculateThreadTops( {
			anchors: anchorTops(),
			heights,
			selectedId,
		} );

		/*
		 * Card tops are document-space, but the board sits below the rail's
		 * header inside a fixed panel. Subtracting the scroller's viewport top
		 * - a constant, since the rail is fixed - converts one to the other.
		 * The board's own scroll translation supplies the rest.
		 */
		const origin = boardEl.parentElement?.getBoundingClientRect().top ?? 0;

		for ( const [ id, top ] of Object.entries( tops ) ) {
			cards.get( id )?.style.setProperty( 'top', `${ top - origin }px` );
		}

		boardEl.style.height = '';
	}

	/**
	 * Tracks the page scroll.
	 *
	 * Card tops are document-space but the rail is fixed, so the board is
	 * translated to bring the two back into agreement. One property write per
	 * frame, rather than repositioning every card.
	 */
	function applyScroll(): void {
		root.style.setProperty(
			'--wp-notes-preview-scroll',
			`${ -window.scrollY }px`
		);
	}

	/** Coalesces bursts of layout changes into one paint. */
	function schedule(): void {
		window.cancelAnimationFrame( frame );
		frame = window.requestAnimationFrame( () => {
			measure();
			applyScroll();
		} );
	}

	/**
	 * Marks the block a note belongs to, so the connection between a card and
	 * the content it is about survives the eye travelling between them.
	 *
	 * @param id Selected note ID, or null to clear.
	 */
	function markSelectedBlock( id: string | null ): void {
		for ( const block of document.querySelectorAll< HTMLElement >(
			NOTE_BLOCK_SELECTOR
		) ) {
			block.classList.remove( 'is-note-selected' );
			block.style.removeProperty( '--wp-notes-preview-author-color' );
		}

		if ( ! id ) {
			return;
		}

		const block = anchors
			.get( id )
			?.closest< HTMLElement >( NOTE_BLOCK_SELECTOR );

		if ( ! block ) {
			return;
		}

		block.classList.add( 'is-note-selected' );
		block.style.setProperty(
			'--wp-notes-preview-author-color',
			cards.get( id )?.dataset.authorColor ?? ''
		);
	}

	function setSelected( id: string | null ): void {
		selectedId = id;
		markSelectedBlock( id );
		schedule();
	}

	function scrollToAnchor( id: string ): void {
		anchors
			.get( id )
			?.scrollIntoView( { block: 'center', behavior: 'smooth' } );
	}

	const observer = new window.ResizeObserver( schedule );
	observer.observe( document.body );

	const passive = { passive: true } as const;
	window.addEventListener( 'resize', schedule, passive );
	window.addEventListener( 'scroll', applyScroll, passive );

	buildIndicators();
	schedule();

	return {
		measure: schedule,
		setSelected,
		scrollToAnchor,
		destroy() {
			window.cancelAnimationFrame( frame );
			observer.disconnect();
			window.removeEventListener( 'resize', schedule );
			window.removeEventListener( 'scroll', applyScroll );
		},
	};
}
