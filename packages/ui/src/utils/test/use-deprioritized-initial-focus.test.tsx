import { render, screen } from '@testing-library/react';
import { createRef, useEffect } from '@wordpress/element';
import { useDeprioritizedInitialFocus } from '../use-deprioritized-initial-focus';

const ATTR = 'data-test-deprioritized';

function TestHarness( {
	initialFocus,
	onResolved,
}: {
	initialFocus?: Parameters<
		typeof useDeprioritizedInitialFocus
	>[ 0 ][ 'initialFocus' ];
	onResolved: (
		result: ReturnType< typeof useDeprioritizedInitialFocus >
	) => void;
} ) {
	const result = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttribute: ATTR,
	} );

	useEffect( () => {
		onResolved( result );
	} );

	return (
		<div ref={ result.popupRef } data-testid="popup">
			<button { ...{ [ ATTR ]: '' } }>Close</button>
			<button>Action</button>
			<input type="text" />
		</div>
	);
}

describe( 'useDeprioritizedInitialFocus', () => {
	describe( 'passthrough', () => {
		it( 'passes through false unchanged', () => {
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			render(
				<TestHarness
					initialFocus={ false }
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			expect( resolved!.resolvedInitialFocus ).toBe( false );
		} );

		it( 'passes through a ref unchanged', () => {
			const ref = createRef< HTMLElement >();
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			render(
				<TestHarness
					initialFocus={ ref }
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			expect( resolved!.resolvedInitialFocus ).toBe( ref );
		} );

		it( 'passes through a custom callback unchanged', () => {
			const cb = () => true as const;
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			render(
				<TestHarness
					initialFocus={ cb }
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			expect( resolved!.resolvedInitialFocus ).toBe( cb );
		} );
	} );

	describe( 'default behavior (initialFocus undefined or true)', () => {
		it.each( [ undefined, true ] )(
			'returns a callback when initialFocus is %s',
			( value ) => {
				let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

				render(
					<TestHarness
						initialFocus={ value }
						onResolved={ ( r ) => {
							resolved = r;
						} }
					/>
				);

				expect( typeof resolved!.resolvedInitialFocus ).toBe(
					'function'
				);
			}
		);

		it( 'returns the popup element on touch interactions', () => {
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			render(
				<TestHarness
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			const callback = resolved!.resolvedInitialFocus as (
				type: string
			) => HTMLElement | boolean | null;
			const result = callback( 'touch' );

			expect( result ).toBe( screen.getByTestId( 'popup' ) );
		} );

		it( 'skips the deprioritized element on non-touch interactions', () => {
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			render(
				<TestHarness
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			const callback = resolved!.resolvedInitialFocus as (
				type: string
			) => HTMLElement | boolean | null;
			const result = callback( 'mouse' );

			// Should return the Action button, skipping Close
			expect( result ).toBeInstanceOf( HTMLButtonElement );
			expect( result as HTMLButtonElement ).toHaveTextContent( 'Action' );
		} );

		it( 'falls back to default when only deprioritized elements exist', () => {
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			function OnlyDeprioritized( {
				onResolved: onResolvedProp,
			}: {
				onResolved: (
					r: ReturnType< typeof useDeprioritizedInitialFocus >
				) => void;
			} ) {
				const result = useDeprioritizedInitialFocus( {
					initialFocus: undefined,
					deprioritizedAttribute: ATTR,
				} );

				useEffect( () => {
					onResolvedProp( result );
				} );

				return (
					<div ref={ result.popupRef } data-testid="popup">
						<button { ...{ [ ATTR ]: '' } }>Close</button>
						<p>No other tabbable elements</p>
					</div>
				);
			}

			render(
				<OnlyDeprioritized
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			const callback = resolved!.resolvedInitialFocus as (
				type: string
			) => HTMLElement | boolean | null;
			const result = callback( 'keyboard' );

			// Falls back to Base UI's default
			expect( result ).toBe( true );
		} );

		it( 'returns true when popupRef is not attached', () => {
			let resolved: ReturnType< typeof useDeprioritizedInitialFocus >;

			function NoRef( {
				onResolved: onResolvedProp,
			}: {
				onResolved: (
					r: ReturnType< typeof useDeprioritizedInitialFocus >
				) => void;
			} ) {
				const result = useDeprioritizedInitialFocus( {
					initialFocus: undefined,
					deprioritizedAttribute: ATTR,
				} );

				useEffect( () => {
					onResolvedProp( result );
				} );

				// Intentionally not attaching popupRef to any element
				return <div>Nothing</div>;
			}

			render(
				<NoRef
					onResolved={ ( r ) => {
						resolved = r;
					} }
				/>
			);

			const callback = resolved!.resolvedInitialFocus as (
				type: string
			) => HTMLElement | boolean | null;

			expect( callback( 'touch' ) ).toBe( true );
			expect( callback( 'mouse' ) ).toBe( true );
		} );
	} );
} );
