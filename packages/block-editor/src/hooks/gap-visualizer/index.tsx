import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import BlockPopoverCover from '../../components/block-popover/cover';
import { useBlockElement } from '../../components/block-list/use-block-props/use-block-refs';
import { measureGapLayout, getLayoutContainer } from './measure-layout';

export interface GapRect {
	type: string;
	left: number;
	top: number;
	width: number;
	height: number;
	right?: number;
	bottom?: number;
}

export interface GapVisualizerProps {
	clientId: string;
}

/**
 * Checks whether two lists of gap visualizer rects are deeply equal
 * (rounded to within 0.01px for numeric coordinates).
 *
 * @param prev Previous rects list.
 * @param next Next rects list.
 *
 * @return True if rect lists are deeply equal within 0.01px.
 */
function areRectsEqual(
	prev: GapRect[] | null | undefined,
	next: GapRect[] | null | undefined
): boolean {
	if ( prev === next ) {
		return true;
	}
	if ( ! prev || ! next || prev.length !== next.length ) {
		return false;
	}
	for ( let i = 0; i < prev.length; i++ ) {
		const p = prev[ i ];
		const n = next[ i ];
		if ( p.type !== n.type ) {
			return false;
		}
		if (
			Math.abs( p.left - n.left ) >= 0.01 ||
			Math.abs( p.top - n.top ) >= 0.01 ||
			Math.abs( p.width - n.width ) >= 0.01 ||
			Math.abs( p.height - n.height ) >= 0.01
		) {
			return false;
		}
	}
	return true;
}

/**
 * Extracts the wp-container-* class from an element's class list.
 *
 * @param element DOM element.
 *
 * @return Container class or null if not found.
 */
function getContainerClass(
	element: Element | null | undefined
): string | null {
	if ( ! element ) {
		return null;
	}
	const layoutContainer = getLayoutContainer( element );
	if ( layoutContainer ) {
		for ( const cls of layoutContainer.classList ) {
			if ( cls.startsWith( 'wp-container-' ) ) {
				return cls;
			}
		}
	}
	if ( element !== layoutContainer ) {
		for ( const cls of element.classList ) {
			if ( cls.startsWith( 'wp-container-' ) ) {
				return cls;
			}
		}
	}
	return null;
}

const styleCacheByDocument = new WeakMap<
	Document,
	Map< string, HTMLStyleElement >
>();

/**
 * Finds the specific layout <style> element injected by EditorStyles
 * for the given block element, matching its container class with a boundary aware regex.
 * Caches matching style elements by document and class to avoid querying all <style> tags on every tick.
 *
 * @param blockElement   The block DOM node.
 * @param containerClass Optional pre-extracted container class name.
 * @param forceRescan    Whether to bypass cache and rescan DOM styles.
 *
 * @return The matching <style> element or null if not found.
 */
function findBlockLayoutStyle(
	blockElement: Element | null | undefined,
	containerClass: string | null = getContainerClass( blockElement ),
	forceRescan: boolean = false
): HTMLStyleElement | null {
	if ( ! blockElement || ! containerClass ) {
		return null;
	}

	const doc = blockElement.ownerDocument || document;
	let cache = styleCacheByDocument.get( doc );
	if ( ! cache ) {
		cache = new Map();
		styleCacheByDocument.set( doc, cache );
	}

	if ( ! forceRescan ) {
		const cached = cache.get( containerClass );
		if ( cached && cached.isConnected ) {
			return cached;
		}
	}

	// Boundary-aware regex: prevents prefix collisions (e.g. ...-1 vs ...-12).
	const classRegex = new RegExp(
		'\\.' + containerClass + '(?=[^a-zA-Z0-9_-]|$)'
	);

	const styles = doc.querySelectorAll( 'style' );
	for ( const style of styles ) {
		if ( style.textContent && classRegex.test( style.textContent ) ) {
			cache.set( containerClass, style );
			return style;
		}
	}
	return null;
}

/**
 * Visualizes the gap spacing of a block container for any layout type.
 *
 * When active, it renders all active gap strips across both axes (horizontal columns and vertical rows).
 *
 * @param props          Component props.
 * @param props.clientId Block client ID.
 *
 * @return Visualizer popover cover element or null if not applicable.
 */
export function GapVisualizer( { clientId }: GapVisualizerProps ) {
	const blockElement = useBlockElement( clientId );
	const [ rects, setRects ] = useState< GapRect[] >( [] );
	const rectCountRef = useRef< number >( 0 );
	const containerRef = useRef< HTMLDivElement | null >( null );
	const setContainerRef = useCallback( ( node: HTMLDivElement | null ) => {
		containerRef.current = node;
	}, [] );
	const currentRectsRef = useRef< GapRect[] >( [] );
	const isMountedRef = useRef< boolean >( true );
	const isMicrotaskQueuedRef = useRef< boolean >( false );

	useEffect( () => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, [] );

	// Fast imperative DOM writer: updates rect divs directly without React reconciliation.
	const applyRectsToDom = useCallback( ( rectsList: GapRect[] ) => {
		const container = containerRef.current;
		if ( ! container ) {
			return;
		}
		for ( let i = 0; i < rectsList.length; i++ ) {
			const el = container.children[ i ] as HTMLElement | undefined;
			const r = rectsList[ i ];
			if ( el && r ) {
				el.style.left = `${ r.left }px`;
				el.style.top = `${ r.top }px`;
				el.style.width = `${ r.width }px`;
				el.style.height = `${ r.height }px`;
				el.dataset.type = r.type;
			}
		}
	}, [] );

	const update = useCallback( () => {
		if ( ! blockElement || ! isMountedRef.current ) {
			return;
		}

		const nextRects = measureGapLayout(
			blockElement as HTMLElement
		) as GapRect[];

		// Bail out if computed rects are unchanged within 0.01px.
		if ( areRectsEqual( currentRectsRef.current, nextRects ) ) {
			return;
		}

		currentRectsRef.current = nextRects;

		if ( nextRects.length !== rectCountRef.current ) {
			rectCountRef.current = nextRects.length;
			setRects( nextRects );
		} else {
			applyRectsToDom( nextRects );
		}
	}, [ blockElement, applyRectsToDom ] );

	// Merging multiple synchronous mutation/resize callbacks into a single measurement.
	const scheduleImmediateUpdate = useCallback( () => {
		if ( ! isMountedRef.current ) {
			return;
		}
		if ( isMicrotaskQueuedRef.current ) {
			return;
		}
		isMicrotaskQueuedRef.current = true;
		queueMicrotask( () => {
			isMicrotaskQueuedRef.current = false;
			if ( ! isMountedRef.current ) {
				return;
			}
			update();
		} );
	}, [ update ] );

	// Synchronous initial measurement on mount to avoid a 1 frame empty visualizer flicker.
	useLayoutEffect( () => {
		if ( blockElement ) {
			update();
		}
	}, [ blockElement, update ] );

	// Observers for DOM mutations, element resizing, and layout <style> changes.
	useEffect( () => {
		if ( ! blockElement ) {
			return;
		}

		const doc = blockElement.ownerDocument || document;

		let currentContainerClass = getContainerClass( blockElement );
		let currentStyleEl = findBlockLayoutStyle(
			blockElement,
			currentContainerClass
		);

		const styleObserver = new window.MutationObserver(
			scheduleImmediateUpdate
		);

		function bindStyleObserver( styleEl: HTMLStyleElement | null ) {
			if ( styleEl ) {
				styleObserver.observe( styleEl, {
					characterData: true,
					childList: true,
					subtree: true,
				} );
			}
		}

		bindStyleObserver( currentStyleEl );

		const mutationObserver = new window.MutationObserver( () => {
			observeChildren();

			const newContainerClass = getContainerClass( blockElement );
			if ( newContainerClass !== currentContainerClass ) {
				currentContainerClass = newContainerClass;
				const newStyleEl = findBlockLayoutStyle(
					blockElement,
					currentContainerClass,
					true
				);
				if ( newStyleEl !== currentStyleEl ) {
					currentStyleEl = newStyleEl;
					styleObserver.disconnect();
					bindStyleObserver( newStyleEl );
				}
			}

			scheduleImmediateUpdate();
		} );

		mutationObserver.observe( blockElement, {
			attributes: true,
			attributeFilter: [ 'style', 'class' ],
			childList: true,
		} );

		const layoutContainer = getLayoutContainer( blockElement );
		if ( layoutContainer && layoutContainer !== blockElement ) {
			mutationObserver.observe( layoutContainer, {
				attributes: true,
				attributeFilter: [ 'style', 'class' ],
				childList: true,
			} );
		}

		const resizeObserver = new window.ResizeObserver( () => {
			scheduleImmediateUpdate();
		} );
		resizeObserver.observe( blockElement );

		function observeChildren() {
			if ( ! blockElement ) {
				return;
			}
			for ( const child of blockElement.children ) {
				resizeObserver.observe( child );
			}
			if ( layoutContainer && layoutContainer !== blockElement ) {
				resizeObserver.observe( layoutContainer );
				for ( const child of layoutContainer.children ) {
					resizeObserver.observe( child );
				}
			}
		}

		observeChildren();

		const styleContainerObserver = new window.MutationObserver( () => {
			if ( ! currentStyleEl || ! currentStyleEl.isConnected ) {
				const newStyleEl = findBlockLayoutStyle(
					blockElement,
					currentContainerClass,
					true
				);
				if ( newStyleEl && newStyleEl !== currentStyleEl ) {
					currentStyleEl = newStyleEl;
					styleObserver.disconnect();
					bindStyleObserver( newStyleEl );
				}
			}
			scheduleImmediateUpdate();
		} );

		if ( doc.head ) {
			styleContainerObserver.observe( doc.head, {
				childList: true,
			} );
		}
		if ( doc.body && doc.body !== doc.head ) {
			styleContainerObserver.observe( doc.body, {
				childList: true,
			} );
		}

		return () => {
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			styleObserver.disconnect();
			styleContainerObserver.disconnect();
		};
	}, [ blockElement, scheduleImmediateUpdate, update ] );

	useLayoutEffect( () => {
		applyRectsToDom( currentRectsRef.current );
	} );

	if ( rects.length === 0 ) {
		return null;
	}

	return (
		<BlockPopoverCover
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<div
				ref={ setContainerRef }
				className="block-editor__gap-visualizer"
			>
				{ rects.map( ( r, index ) => (
					<div
						key={ index }
						data-type={ r.type }
						data-testid="block-editor-gap-visualizer-rect"
						style={ {
							left: `${ r.left }px`,
							top: `${ r.top }px`,
							width: `${ r.width }px`,
							height: `${ r.height }px`,
						} }
						className="block-editor__gap-visualizer-rect"
					/>
				) ) }
			</div>
		</BlockPopoverCover>
	);
}

export default GapVisualizer;
