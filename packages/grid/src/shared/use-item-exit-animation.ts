/**
 * WordPress dependencies
 */
import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ItemExitOverlayRect } from './item-exit-overlay';
import type { RectSnapshot } from './use-layout-shift-animation';

/*
 * Last-resort cleanup if `animationend` never fires (the overlay's
 * `onAnimationEnd` is the primary path). Kept well above the motion
 * token durations so the timeout can never clip the exit animation.
 */
const EXIT_SAFETY_TIMEOUT_MS = 1000;

export type ExitingGridItem = {
	key: string;
	rect: ItemExitOverlayRect;
	child: React.ReactElement;
};

type UseItemExitAnimationOptions = {
	container: HTMLElement | null;
	enabled: boolean;
	layoutKeys: ReadonlySet< string >;
	getPositionsBeforeLastChange: () => ReadonlyMap<
		string,
		RectSnapshot
	> | null;
	childrenCacheRef: React.MutableRefObject<
		Map< string, React.ReactElement >
	>;
};

type UseItemExitAnimationResult = {
	exitingItems: ExitingGridItem[];
	hasExitingItems: boolean;
	clearExitingItem: ( key: string ) => void;
};

function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
	);
}

/**
 * When `layout` loses keys in edit mode, keeps a short-lived overlay at
 * the removed tile's last position (scale + fade) while siblings FLIP.
 *
 * @param root0                              Hook options.
 * @param root0.container                    Surface root that contains grid tiles.
 * @param root0.enabled                      When false, exiting state is cleared.
 * @param root0.layoutKeys                   Keys in the committed `layout` prop.
 * @param root0.getPositionsBeforeLastChange Container-relative rects before the latest layout commit.
 * @param root0.childrenCacheRef             Last rendered children keyed by tile id.
 * @return Exiting overlays and a callback to dismiss one by key.
 */
export function useItemExitAnimation( {
	container,
	enabled,
	layoutKeys,
	getPositionsBeforeLastChange,
	childrenCacheRef,
}: UseItemExitAnimationOptions ): UseItemExitAnimationResult {
	const [ exitingItems, setExitingItems ] = useState< ExitingGridItem[] >(
		[]
	);
	const prevLayoutKeysRef = useRef< Set< string > >( new Set() );
	const exitTimeoutsRef = useRef<
		Map< string, ReturnType< typeof setTimeout > >
	>( new Map() );

	const clearExitingItem = useCallback(
		( key: string ) => {
			const timeout = exitTimeoutsRef.current.get( key );
			if ( timeout ) {
				clearTimeout( timeout );
				exitTimeoutsRef.current.delete( key );
			}
			setExitingItems( ( current ) =>
				current.filter( ( item ) => item.key !== key )
			);
			childrenCacheRef.current.delete( key );
		},
		[ childrenCacheRef ]
	);

	const scheduleExitComplete = useCallback(
		( key: string ) => {
			if ( exitTimeoutsRef.current.has( key ) ) {
				return;
			}
			const timeout = setTimeout( () => {
				exitTimeoutsRef.current.delete( key );
				clearExitingItem( key );
			}, EXIT_SAFETY_TIMEOUT_MS );
			exitTimeoutsRef.current.set( key, timeout );
		},
		[ clearExitingItem ]
	);

	useLayoutEffect( () => {
		if ( ! enabled || ! container ) {
			prevLayoutKeysRef.current = new Set( layoutKeys );
			for ( const timeout of exitTimeoutsRef.current.values() ) {
				clearTimeout( timeout );
			}
			exitTimeoutsRef.current.clear();
			setExitingItems( [] );
			return;
		}

		const prevKeys = prevLayoutKeysRef.current;
		const removed: string[] = [];
		for ( const key of prevKeys ) {
			if ( ! layoutKeys.has( key ) ) {
				removed.push( key );
			}
		}
		prevLayoutKeysRef.current = new Set( layoutKeys );

		if ( removed.length === 0 ) {
			return;
		}

		const lastPositions = getPositionsBeforeLastChange();
		if ( ! lastPositions ) {
			return;
		}

		const nextExiting: ExitingGridItem[] = [];
		for ( const key of removed ) {
			const position = lastPositions.get( key );
			const child = childrenCacheRef.current.get( key );
			if ( ! position || ! child ) {
				continue;
			}
			nextExiting.push( {
				key,
				rect: position,
				child,
			} );
		}

		if ( nextExiting.length === 0 ) {
			return;
		}

		if ( prefersReducedMotion() ) {
			// Siblings snap into place via the layout-shift hook; skip the
			// exit ghost (and its synchronous mount) entirely.
			for ( const { key } of nextExiting ) {
				childrenCacheRef.current.delete( key );
			}
			return;
		}

		// A state update inside a layout effect is flushed before paint,
		// so the ghost mounts in the same frame the tile is removed.
		setExitingItems( ( current ) => [ ...current, ...nextExiting ] );

		for ( const { key } of nextExiting ) {
			scheduleExitComplete( key );
		}
	}, [
		container,
		enabled,
		getPositionsBeforeLastChange,
		layoutKeys,
		childrenCacheRef,
		scheduleExitComplete,
	] );

	useLayoutEffect( () => {
		const exitTimeouts = exitTimeoutsRef.current;
		return () => {
			for ( const timeout of exitTimeouts.values() ) {
				clearTimeout( timeout );
			}
			exitTimeouts.clear();
		};
	}, [] );

	return {
		exitingItems,
		hasExitingItems: exitingItems.length > 0,
		clearExitingItem,
	};
}
