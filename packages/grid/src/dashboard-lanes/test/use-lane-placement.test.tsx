/**
 * External dependencies
 */
import { render, act, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GRID_ITEM_DATA_KEY } from '../../shared/grid-item-key';
import { useLanePlacement } from '../use-lane-placement';
import type {
	UseLanePlacementInput,
	UseLanePlacementResult,
} from '../use-lane-placement';

type Entry = {
	target: Element;
	contentRect: { height: number; width: number };
};

class MockResizeObserver {
	static instances: MockResizeObserver[] = [];
	static lastInstance(): MockResizeObserver | undefined {
		return MockResizeObserver.instances[
			MockResizeObserver.instances.length - 1
		];
	}
	static reset() {
		MockResizeObserver.instances = [];
	}

	callback: ResizeObserverCallback;
	observed: Set< Element > = new Set();
	disconnected = false;

	constructor( callback: ResizeObserverCallback ) {
		this.callback = callback;
		MockResizeObserver.instances.push( this );
	}
	observe( element: Element ) {
		this.observed.add( element );
	}
	unobserve( element: Element ) {
		this.observed.delete( element );
	}
	disconnect() {
		this.observed.clear();
		this.disconnected = true;
	}
	fire( entries: Entry[] ) {
		this.callback(
			entries as unknown as ResizeObserverEntry[],
			this as unknown as ResizeObserver
		);
	}
}

let originalResizeObserver: typeof ResizeObserver;
let originalSupports: typeof CSS.supports | undefined;
let originalRaf: typeof requestAnimationFrame;

function installMockObserver() {
	originalResizeObserver = global.ResizeObserver;
	MockResizeObserver.reset();
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		MockResizeObserver;
}

function restoreObserver() {
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		originalResizeObserver;
}

function setNativeSupport( supported: boolean ) {
	if ( typeof CSS === 'undefined' ) {
		( global as unknown as { CSS: unknown } ).CSS = {
			supports: () => supported,
		};
		return;
	}
	originalSupports = CSS.supports;
	CSS.supports = ( property: string, value?: string ) => {
		if ( property === 'display' && value === 'grid-lanes' ) {
			return supported;
		}
		return originalSupports
			? originalSupports.call( CSS, property, value as string )
			: false;
	};
}

function restoreSupport() {
	if ( originalSupports ) {
		CSS.supports = originalSupports;
		originalSupports = undefined;
	}
}

function flushRaf() {
	// jsdom polyfills `requestAnimationFrame` via `setTimeout`; an
	// `act` boundary lets React commit any state set inside the rAF.
	jest.runAllTimers();
}

beforeEach( () => {
	installMockObserver();
	originalRaf = global.requestAnimationFrame;
	global.requestAnimationFrame = ( cb ) =>
		setTimeout( () => cb( performance.now() ), 0 ) as unknown as number;
	jest.useFakeTimers();
} );

afterEach( () => {
	jest.useRealTimers();
	global.requestAnimationFrame = originalRaf;
	restoreObserver();
	restoreSupport();
} );

type HarnessProps = {
	input: UseLanePlacementInput;
	measuredHeights?: Record< string, number >;
	onResult?: ( result: UseLanePlacementResult ) => void;
};

function Harness( { input, measuredHeights, onResult }: HarnessProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >(
		null
	);
	const result = useLanePlacement( container, input );
	if ( onResult ) {
		onResult( result );
	}
	return (
		<div ref={ setContainer } data-testid="container">
			{ input.items.map( ( item ) => (
				<div
					key={ item.key }
					{ ...{ [ GRID_ITEM_DATA_KEY ]: item.key } }
					data-testid={ `item-${ item.key }` }
					style={ {
						...result.itemStyles.get( item.key ),
						height: measuredHeights?.[ item.key ] ?? 0,
					} }
				/>
			) ) }
		</div>
	);
}

function captureLatestResult() {
	let latest: UseLanePlacementResult | null = null;
	const onResult = ( result: UseLanePlacementResult ) => {
		latest = result;
	};
	const get = (): UseLanePlacementResult => {
		if ( ! latest ) {
			throw new Error( 'Hook never produced a result' );
		}
		return latest;
	};
	return { onResult, get };
}

function fireMeasurements( heights: Record< string, number > ) {
	const observer = MockResizeObserver.lastInstance();
	if ( ! observer ) {
		throw new Error( 'No ResizeObserver instance registered' );
	}
	const entries: Entry[] = [];
	for ( const [ key, height ] of Object.entries( heights ) ) {
		const element = screen.getByTestId( `item-${ key }` );
		entries.push( {
			target: element,
			contentRect: { height, width: 0 },
		} );
	}
	act( () => {
		observer.fire( entries );
		flushRaf();
	} );
}

describe( 'useLanePlacement', () => {
	describe( 'native support', () => {
		it( 'returns isPolyfilled=false and span-only styles when supported', () => {
			setNativeSupport( true );
			const { onResult, get } = captureLatestResult();

			render(
				<Harness
					input={ {
						items: [
							{ key: 'a', span: 1 },
							{ key: 'b', span: 2 },
						],
						lanes: 3,
						gap: 16,
						flowTolerance: 0,
					} }
					onResult={ onResult }
				/>
			);
			act( () => {
				flushRaf();
			} );

			const result = get();
			expect( result.isPolyfilled ).toBe( false );
			expect( result.itemStyles.get( 'a' ) ).toEqual( {
				gridColumn: 'span 1',
			} );
			expect( result.itemStyles.get( 'b' ) ).toEqual( {
				gridColumn: 'span 2',
			} );
			// No observers should have been instantiated.
			expect( MockResizeObserver.instances.length ).toBe( 0 );
		} );
	} );

	describe( 'polyfill path', () => {
		it( 'returns native-shape styles before measurement completes', () => {
			setNativeSupport( false );
			const { onResult, get } = captureLatestResult();

			render(
				<Harness
					input={ {
						items: [
							{ key: 'a', span: 1 },
							{ key: 'b', span: 2 },
						],
						lanes: 3,
						gap: 16,
						flowTolerance: 0,
					} }
					onResult={ onResult }
				/>
			);

			const result = get();
			expect( result.isPolyfilled ).toBe( true );
			expect( result.itemStyles.get( 'a' ) ).toEqual( {
				gridColumn: 'span 1',
			} );
		} );

		it( 'observes children and emits placement styles after measurement', () => {
			setNativeSupport( false );
			const { onResult, get } = captureLatestResult();

			render(
				<Harness
					input={ {
						items: [
							{ key: 'a', span: 1 },
							{ key: 'b', span: 1 },
							{ key: 'c', span: 1 },
						],
						lanes: 3,
						gap: 0,
						flowTolerance: 0,
						rowUnit: 4,
					} }
					onResult={ onResult }
				/>
			);

			// One ResizeObserver should have been constructed for the
			// container's children.
			expect( MockResizeObserver.instances.length ).toBe( 1 );
			const observer = MockResizeObserver.lastInstance();
			expect( observer?.observed.size ).toBe( 3 );

			fireMeasurements( {
				a: 100,
				b: 80,
				c: 60,
			} );

			const result = get();
			expect( result.isPolyfilled ).toBe( true );

			// All three items should land in lane 0/1/2 respectively
			// (zero baselines), at row 1.
			const a = result.itemStyles.get( 'a' )!;
			const b = result.itemStyles.get( 'b' )!;
			const c = result.itemStyles.get( 'c' )!;
			expect( a.gridColumnStart ).toBe( 1 );
			expect( a.gridRowStart ).toBe( 1 );
			expect( a.gridRowEnd ).toBe( 'span 25' ); // 100 / 4
			expect( b.gridColumnStart ).toBe( 2 );
			expect( b.gridRowEnd ).toBe( 'span 20' ); // 80 / 4
			expect( c.gridColumnStart ).toBe( 3 );
			expect( c.gridRowEnd ).toBe( 'span 15' ); // 60 / 4
		} );

		it( 'recomputes when an item resizes', () => {
			setNativeSupport( false );
			const { onResult, get } = captureLatestResult();

			render(
				<Harness
					input={ {
						items: [
							{ key: 'a', span: 1 },
							{ key: 'b', span: 1 },
						],
						lanes: 1,
						gap: 0,
						flowTolerance: 0,
						rowUnit: 4,
					} }
					onResult={ onResult }
				/>
			);

			fireMeasurements( { a: 100, b: 50 } );
			expect( get().itemStyles.get( 'b' )?.gridRowStart ).toBe( 26 ); // 100/4 + 1

			fireMeasurements( { a: 200 } );
			expect( get().itemStyles.get( 'b' )?.gridRowStart ).toBe( 51 ); // 200/4 + 1
		} );
	} );

	describe( 'cleanup', () => {
		it( 'disconnects observers on unmount', () => {
			setNativeSupport( false );

			const { unmount } = render(
				<Harness
					input={ {
						items: [ { key: 'a', span: 1 } ],
						lanes: 3,
						gap: 16,
						flowTolerance: 0,
					} }
				/>
			);

			const observer = MockResizeObserver.lastInstance();
			expect( observer ).toBeDefined();
			expect( observer!.disconnected ).toBe( false );

			unmount();
			expect( observer!.disconnected ).toBe( true );
		} );
	} );
} );
