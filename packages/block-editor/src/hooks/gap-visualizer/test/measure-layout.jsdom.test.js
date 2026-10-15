import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { measureGapLayout, getLayoutContainer } from '../measure-layout';

describe( 'measureGapLayout', () => {
	let container;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		container.remove();
	} );

	it( 'dispatches to flex engine for display: flex without engine mocks', () => {
		const child1 = document.createElement( 'div' );
		const child2 = document.createElement( 'div' );
		container.appendChild( child1 );
		container.appendChild( child2 );

		const originalGetComputedStyle = window.getComputedStyle;
		window.getComputedStyle = ( el ) => {
			if ( el === container ) {
				return {
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'nowrap',
					columnGap: '20px',
					rowGap: '0px',
					direction: 'ltr',
					paddingTop: '0px',
					paddingRight: '0px',
					paddingBottom: '0px',
					paddingLeft: '0px',
					writingMode: 'horizontal-tb',
				};
			}
			return {
				display: 'block',
				position: 'static',
				visibility: 'visible',
				marginTop: '0px',
				marginRight: '0px',
				marginBottom: '0px',
				marginLeft: '0px',
			};
		};

		container.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			right: 220,
			bottom: 50,
			width: 220,
			height: 50,
		} );
		Object.defineProperty( container, 'offsetWidth', {
			value: 220,
			configurable: true,
		} );
		Object.defineProperty( container, 'offsetHeight', {
			value: 50,
			configurable: true,
		} );

		child1.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			right: 100,
			bottom: 50,
			width: 100,
			height: 50,
		} );
		child2.getBoundingClientRect = () => ( {
			left: 120,
			top: 0,
			right: 220,
			bottom: 50,
			width: 100,
			height: 50,
		} );

		try {
			const rects = measureGapLayout( container );
			expect( rects ).toHaveLength( 1 );
			expect( rects[ 0 ] ).toMatchObject( {
				type: 'column',
				left: 100,
				top: 0,
				width: 20,
				height: 50,
			} );
		} finally {
			window.getComputedStyle = originalGetComputedStyle;
		}
	} );

	// TODO: Once support for grid/flow layout is introduced in a future PR,
	// update this test to assert that grid/flow gap rectangles are returned instead.
	it( 'returns empty array for display: grid, display: block, display: flow-root, and unsupported/null', () => {
		expect( measureGapLayout( null ) ).toEqual( [] );

		const originalGetComputedStyle = window.getComputedStyle;
		window.getComputedStyle = () => ( { display: 'none' } );
		try {
			expect( measureGapLayout( container ) ).toEqual( [] );
		} finally {
			window.getComputedStyle = originalGetComputedStyle;
		}

		window.getComputedStyle = () => ( { display: 'grid' } );
		try {
			expect( measureGapLayout( container ) ).toEqual( [] );
		} finally {
			window.getComputedStyle = originalGetComputedStyle;
		}

		window.getComputedStyle = () => ( { display: 'block' } );
		try {
			expect( measureGapLayout( container ) ).toEqual( [] );
		} finally {
			window.getComputedStyle = originalGetComputedStyle;
		}

		window.getComputedStyle = () => ( { display: 'flow-root' } );
		try {
			expect( measureGapLayout( container ) ).toEqual( [] );
		} finally {
			window.getComputedStyle = originalGetComputedStyle;
		}
	} );

	describe( 'getLayoutContainer and container resolution', () => {
		it( 'returns the block element itself when it has block-editor-block-list__layout and a direct child also has it', () => {
			const blockElement = document.createElement( 'div' );
			blockElement.className =
				'wp-block wp-block-group block-editor-block-list__layout is-layout-flex';

			const childBlock = document.createElement( 'div' );
			childBlock.className =
				'wp-block wp-block-group block-editor-block-list__layout is-layout-flex is-nowrap';
			blockElement.appendChild( childBlock );

			expect( getLayoutContainer( blockElement ) ).toBe( blockElement );
		} );

		it( 'returns the legacy inner container wrapper when present', () => {
			const blockElement = document.createElement( 'div' );
			blockElement.className = 'wp-block wp-block-group';

			const innerContainer = document.createElement( 'div' );
			innerContainer.className =
				'wp-block-group__inner-container block-editor-block-list__layout is-layout-flow';
			blockElement.appendChild( innerContainer );

			expect( getLayoutContainer( blockElement ) ).toBe( innerContainer );
		} );

		it( 'returns the legacy cover inner container wrapper when present', () => {
			const blockElement = document.createElement( 'div' );
			blockElement.className = 'wp-block wp-block-cover';

			const innerContainer = document.createElement( 'div' );
			innerContainer.className =
				'wp-block-cover__inner-container block-editor-block-list__layout is-layout-flow';
			blockElement.appendChild( innerContainer );

			expect( getLayoutContainer( blockElement ) ).toBe( innerContainer );
		} );

		it( 'measureGapLayout measures the block element itself when child also has block-editor-block-list__layout', () => {
			const blockElement = document.createElement( 'div' );
			blockElement.className =
				'wp-block wp-block-group block-editor-block-list__layout is-layout-flex';
			document.body.appendChild( blockElement );

			const child1 = document.createElement( 'div' );
			child1.className =
				'wp-block wp-block-group block-editor-block-list__layout is-layout-flex';
			const child2 = document.createElement( 'p' );
			blockElement.appendChild( child1 );
			blockElement.appendChild( child2 );

			const originalGetComputedStyle = window.getComputedStyle;
			window.getComputedStyle = ( el ) => {
				if ( el === blockElement ) {
					return {
						display: 'flex',
						flexDirection: 'column',
						flexWrap: 'nowrap',
						columnGap: '0px',
						rowGap: '20px',
						direction: 'ltr',
						paddingTop: '0px',
						paddingRight: '0px',
						paddingBottom: '0px',
						paddingLeft: '0px',
						writingMode: 'horizontal-tb',
					};
				}
				if ( el === child1 ) {
					return {
						display: 'flex',
						flexDirection: 'row',
						columnGap: '50px',
						rowGap: '0px',
						position: 'static',
						visibility: 'visible',
					};
				}
				return {
					display: 'block',
					position: 'static',
					visibility: 'visible',
					marginTop: '0px',
					marginRight: '0px',
					marginBottom: '0px',
					marginLeft: '0px',
				};
			};

			blockElement.getBoundingClientRect = () => ( {
				left: 0,
				top: 0,
				right: 300,
				bottom: 120,
				width: 300,
				height: 120,
			} );
			Object.defineProperty( blockElement, 'offsetWidth', {
				value: 300,
				configurable: true,
			} );
			Object.defineProperty( blockElement, 'offsetHeight', {
				value: 120,
				configurable: true,
			} );

			child1.getBoundingClientRect = () => ( {
				left: 0,
				top: 0,
				right: 300,
				bottom: 50,
				width: 300,
				height: 50,
			} );
			child2.getBoundingClientRect = () => ( {
				left: 0,
				top: 70,
				right: 300,
				bottom: 120,
				width: 300,
				height: 50,
			} );

			try {
				const rects = measureGapLayout( blockElement );
				expect( rects ).toHaveLength( 1 );
				expect( rects[ 0 ] ).toEqual( {
					type: 'row',
					left: 0,
					top: 50,
					width: 300,
					height: 20,
					right: 300,
					bottom: 70,
				} );
			} finally {
				window.getComputedStyle = originalGetComputedStyle;
				blockElement.remove();
			}
		} );
	} );
} );
