import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { measureFlexLayout } from '../measure-flex-layout';

describe( 'measureFlexLayout', () => {
	let container;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		container.remove();
	} );

	test( 'returns safe fallback values when containerElement is null or undefined', () => {
		expect( measureFlexLayout( null ) ).toEqual( {
			boxes: [],
			config: {
				columnGap: 0,
				rowGap: 0,
				direction: 'row',
				flexWrap: 'nowrap',
				isSpaceBetween: false,
				isRtl: false,
				contentBox: { left: 0, top: 0, width: 0, height: 0 },
			},
		} );
	} );

	test( 'filters out display: none and zero size children, but includes visibility: hidden children', () => {
		const visible = document.createElement( 'div' );
		visible.getBoundingClientRect = () => ( {
			left: 10,
			top: 10,
			width: 100,
			height: 40,
			right: 110,
			bottom: 50,
		} );

		const hiddenNone = document.createElement( 'div' );
		hiddenNone.style.display = 'none';
		hiddenNone.getBoundingClientRect = () => ( {
			left: 120,
			top: 10,
			width: 100,
			height: 40,
			right: 220,
			bottom: 50,
		} );

		const hiddenVisibility = document.createElement( 'div' );
		hiddenVisibility.style.visibility = 'hidden';
		hiddenVisibility.getBoundingClientRect = () => ( {
			left: 130,
			top: 10,
			width: 100,
			height: 40,
			right: 230,
			bottom: 50,
		} );

		const zeroSize = document.createElement( 'div' );
		zeroSize.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0,
		} );

		container.appendChild( visible );
		container.appendChild( hiddenNone );
		container.appendChild( hiddenVisibility );
		container.appendChild( zeroSize );

		const { boxes } = measureFlexLayout( container );
		expect( boxes ).toHaveLength( 2 );
	} );

	test( 'filters out position: absolute and position: fixed children (e.g. block appender)', () => {
		const inFlowChild = document.createElement( 'div' );
		inFlowChild.getBoundingClientRect = () => ( {
			left: 10,
			top: 10,
			width: 100,
			height: 40,
			right: 110,
			bottom: 50,
		} );

		const appender = document.createElement( 'div' );
		appender.className = 'block-list-appender';
		appender.style.position = 'absolute';

		const fixedChild = document.createElement( 'div' );
		fixedChild.style.position = 'fixed';

		container.appendChild( inFlowChild );
		container.appendChild( appender );
		container.appendChild( fixedChild );

		const { boxes } = measureFlexLayout( container );
		expect( boxes ).toHaveLength( 1 );
	} );

	test( 'filters out zero size boxes (width: 0 and height: 0)', () => {
		const zeroSizeChild = document.createElement( 'div' );
		zeroSizeChild.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0,
		} );

		container.appendChild( zeroSizeChild );

		const { boxes } = measureFlexLayout( container );
		expect( boxes ).toHaveLength( 0 );
	} );

	test( 'guards against scale=0 or NaN when offsetWidth/offsetHeight is 0', () => {
		Object.defineProperty( container, 'offsetWidth', { value: 0 } );
		Object.defineProperty( container, 'offsetHeight', { value: 0 } );

		const child = document.createElement( 'div' );
		child.getBoundingClientRect = () => ( {
			left: 10,
			top: 10,
			width: 50,
			height: 50,
			right: 60,
			bottom: 60,
		} );

		container.appendChild( child );

		const { boxes } = measureFlexLayout( container );
		expect( boxes ).toHaveLength( 1 );
		// When scale falls back to 1, norm coordinates are not NaN.
		expect( Number.isFinite( boxes[ 0 ].left ) ).toBe( true );
		expect( Number.isFinite( boxes[ 0 ].top ) ).toBe( true );
	} );

	test( 'extracts layout config properties from computed styles', () => {
		container.style.columnGap = '24px';
		container.style.rowGap = '16px';
		container.style.flexDirection = 'column';
		container.style.flexWrap = 'wrap';
		container.style.justifyContent = 'space-between';

		const { config } = measureFlexLayout( container );
		expect( config.columnGap ).toBe( 24 );
		expect( config.rowGap ).toBe( 16 );
		expect( config.direction ).toBe( 'column' );
		expect( config.flexWrap ).toBe( 'wrap' );
		expect( config.isSpaceBetween ).toBe( true );
	} );

	test( 'uses uniform scale derived from width and ignores rounded offsetHeight', () => {
		Object.defineProperty( container, 'offsetWidth', { value: 500 } );
		Object.defineProperty( container, 'offsetHeight', { value: 300 } );
		container.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			width: 250,
			height: 150.25,
			right: 250,
			bottom: 150.25,
		} );

		const child = document.createElement( 'div' );
		child.getBoundingClientRect = () => ( {
			left: 20,
			top: 30,
			width: 100,
			height: 60,
			right: 120,
			bottom: 90,
		} );

		container.appendChild( child );

		const { boxes } = measureFlexLayout( container );
		expect( boxes ).toHaveLength( 1 );
		expect( boxes[ 0 ].borderBox.width ).toBe( 200 );
		expect( boxes[ 0 ].borderBox.height ).toBe( 120 );
		expect( boxes[ 0 ].borderBox.top ).toBe( 60 );
	} );

	test( 'skips display: contents children cleanly (known limitation)', () => {
		const normalChild = document.createElement( 'div' );
		normalChild.getBoundingClientRect = () => ( {
			left: 10,
			top: 10,
			width: 80,
			height: 30,
			right: 90,
			bottom: 40,
		} );

		const displayContentsChild = document.createElement( 'div' );
		displayContentsChild.style.display = 'contents';
		displayContentsChild.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0,
		} );

		container.appendChild( normalChild );
		container.appendChild( displayContentsChild );

		const { boxes } = measureFlexLayout( container );
		// Contents produces 0x0 getBoundingClientRect, so it is skipped.
		expect( boxes ).toHaveLength( 1 );
	} );
} );
