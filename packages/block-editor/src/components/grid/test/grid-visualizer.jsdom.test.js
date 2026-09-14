import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement, forwardRef } from '@wordpress/element';
import { GridVisualizer } from '../grid-visualizer';
import * as blockRefs from '../../block-list/use-block-props/use-block-refs';

globalThis.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

vi.mock(
	import( '../../block-list/use-block-props/use-block-refs' ),
	async ( importOriginal ) => {
		const original = await importOriginal();
		return {
			...original,
			useBlockElement: vi.fn(),
		};
	}
);

vi.mock( import( '../../block-popover/cover' ), () => ( {
	default: forwardRef( ( { children, className }, ref ) =>
		createElement(
			'div',
			{
				ref,
				className,
				'data-testid': 'block-popover-cover',
			},
			children
		)
	),
} ) );

vi.mock( import( '../../button-block-appender' ), () => ( {
	default: forwardRef( ( { rootClientId, className }, ref ) =>
		createElement(
			'button',
			{
				ref,
				type: 'button',
				className,
				'data-root-client-id': rootClientId,
				'aria-label': 'Add block',
			},
			'+'
		)
	),
} ) );

describe( 'GridVisualizer (Auto Grid mode)', () => {
	const gridClientId = 'grid-block-1';

	beforeEach( () => {
		vi.clearAllMocks();
		window.getComputedStyle = () => ( {
			getPropertyValue: ( prop ) => {
				if ( prop === 'grid-template-columns' ) {
					return '100px 100px 100px';
				}
				if ( prop === 'grid-template-rows' ) {
					return '100px';
				}
				if (
					prop === 'gap' ||
					prop === 'column-gap' ||
					prop === 'row-gap'
				) {
					return '10px';
				}
				if ( prop === 'color' ) {
					return '#000000';
				}
				return '0px';
			},
		} );
	} );

	it( 'renders ButtonBlockAppender in unoccupied cells for Auto Grid', () => {
		const gridElement = document.createElement( 'div' );
		// 1 child block in column 1 (left: 0 to 100)
		const childBlockElement = document.createElement( 'div' );
		childBlockElement.classList.add( 'wp-block' );
		Object.defineProperties( childBlockElement, {
			offsetLeft: { value: 0 },
			offsetTop: { value: 0 },
			offsetWidth: { value: 100 },
			offsetHeight: { value: 100 },
			parentElement: { value: gridElement },
		} );
		gridElement.appendChild( childBlockElement );

		vi.spyOn( blockRefs, 'useBlockElement' ).mockImplementation(
			( clientId ) => {
				if ( clientId === gridClientId ) {
					return gridElement;
				}
				return null;
			}
		);

		render(
			createElement( GridVisualizer, {
				clientId: gridClientId,
				parentLayout: { type: 'grid' },
			} )
		);

		// In Auto Grid mode, all unoccupied cells render appenders
		const appenders = screen.getAllByRole( 'button', {
			name: 'Add block',
		} );
		expect( appenders ).toHaveLength( 2 );
	} );

	it( 'renders no appenders when all cells in Auto Grid are occupied', () => {
		const gridElement = document.createElement( 'div' );
		for ( let i = 0; i < 3; i++ ) {
			const childBlockElement = document.createElement( 'div' );
			childBlockElement.classList.add( 'wp-block' );
			Object.defineProperties( childBlockElement, {
				offsetLeft: { value: i * 110 },
				offsetTop: { value: 0 },
				offsetWidth: { value: 100 },
				offsetHeight: { value: 100 },
				parentElement: { value: gridElement },
			} );
			gridElement.appendChild( childBlockElement );
		}

		vi.spyOn( blockRefs, 'useBlockElement' ).mockImplementation(
			( clientId ) => {
				if ( clientId === gridClientId ) {
					return gridElement;
				}
				return null;
			}
		);

		render(
			createElement( GridVisualizer, {
				clientId: gridClientId,
				parentLayout: { type: 'grid' },
			} )
		);

		expect(
			screen.queryByRole( 'button', { name: 'Add block' } )
		).not.toBeInTheDocument();
	} );
} );
