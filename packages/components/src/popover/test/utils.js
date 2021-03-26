/**
 * Internal dependencies
 */
import {
	computePopoverPosition,
	computePopoverYAxisPosition,
	computePopoverXAxisPosition,
	offsetIframe,
} from '../utils';

describe( 'computePopoverYAxisPosition', () => {
	it( 'should leave the position as is there’s enought space', () => {
		const anchorRect = {
			top: 10,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverYAxisPosition( anchorRect, contentSize, 'bottom' )
		).toEqual( {
			contentHeight: null,
			popoverTop: 30,
			yAxis: 'bottom',
		} );
	} );

	it( "should switch to bottom position if there's not enough space", () => {
		const anchorRect = {
			top: 10,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverYAxisPosition( anchorRect, contentSize, 'top' )
		).toEqual( {
			contentHeight: null,
			popoverTop: 30,
			yAxis: 'bottom',
		} );
	} );

	it( "should set a maxHeight if there's not enough space in any direction", () => {
		const anchorRect = {
			top: 400,
			left: 10,
			bottom: 420,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 500,
		};

		expect(
			computePopoverYAxisPosition( anchorRect, contentSize, 'bottom' )
		).toEqual( {
			contentHeight: 390,
			popoverTop: 400,
			yAxis: 'top',
		} );
	} );

	it( 'should position a popover in the middle', () => {
		const anchorRect = {
			top: 400,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverYAxisPosition( anchorRect, contentSize, 'middle' )
		).toEqual( {
			contentHeight: null,
			popoverTop: 410,
			yAxis: 'middle',
		} );
	} );
} );

describe( 'computePopoverXAxisPosition', () => {
	it( 'should leave the position as is there’s enought space', () => {
		const anchorRect = {
			top: 10,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverXAxisPosition( anchorRect, contentSize, 'right' )
		).toEqual( {
			contentWidth: null,
			popoverLeft: 20,
			xAxis: 'right',
		} );
	} );

	it( "should switch to right position if there's not enough space", () => {
		const anchorRect = {
			top: 10,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverXAxisPosition( anchorRect, contentSize, 'center' )
		).toEqual( {
			contentWidth: null,
			popoverLeft: 20,
			xAxis: 'right',
		} );
	} );

	it( "should center popover if there's not enough space in any direction", () => {
		const anchorRect = {
			top: 10,
			left: 400,
			bottom: 30,
			right: 420,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 800,
			height: 300,
		};

		expect(
			computePopoverXAxisPosition( anchorRect, contentSize, 'right' )
		).toEqual( {
			contentWidth: null,
			popoverLeft: 512,
			xAxis: 'center',
		} );
	} );

	it( 'should set the content width to the viewport width if content is too wide', () => {
		const anchorRect = {
			top: 10,
			left: 400,
			bottom: 30,
			right: 420,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 1500,
			height: 300,
		};

		expect(
			computePopoverXAxisPosition( anchorRect, contentSize, 'right' )
		).toEqual( {
			contentWidth: 1024,
			popoverLeft: 512,
			xAxis: 'center',
		} );
	} );
} );

describe( 'computePopoverPosition', () => {
	it( 'should leave the position as is there’s enought space', () => {
		const anchorRect = {
			top: 10,
			left: 10,
			bottom: 30,
			right: 30,
			width: 20,
			height: 20,
		};

		const contentSize = {
			width: 200,
			height: 300,
		};

		expect(
			computePopoverPosition( anchorRect, contentSize, 'bottom right' )
		).toEqual( {
			contentWidth: null,
			popoverLeft: 20,
			xAxis: 'right',
			contentHeight: null,
			popoverTop: 30,
			yAxis: 'bottom',
		} );
	} );
} );

describe( 'offsetIframe', () => {
	let parent;

	beforeEach( () => {
		parent = document.createElement( 'div' );
		document.body.appendChild( parent );
	} );

	afterEach( () => {
		parent.remove();
	} );

	it( 'returns rect without changes if element is not an iframe', () => {
		const rect = {
			left: 50,
			top: 50,
			bottom: 100,
			right: 100,
			width: 50,
			height: 50,
		};
		const offsettedRect = offsetIframe( rect, parent.ownerDocument );

		expect( offsettedRect ).toEqual( rect );
	} );

	it( 'returns offsetted rect if element is in an iframe', () => {
		const iframeLeft = 25;
		const iframeTop = 50;
		const childLeft = 10;
		const childTop = 100;

		const iframe = document.createElement( 'iframe' );
		parent.appendChild( iframe );
		// JSDom doesn't have a layout engine
		// so we need to mock getBoundingClientRect and DOMRect.
		iframe.getBoundingClientRect = jest.fn( () => ( {
			width: 100,
			height: 100,
			top: iframeTop,
			left: iframeLeft,
		} ) );
		iframe.contentWindow.DOMRect = jest.fn(
			( left, top, width, height ) => ( {
				left,
				top,
				right: left + width,
				bottom: top + height,
				width,
				height,
			} )
		);

		const child = document.createElement( 'div' );
		iframe.contentWindow.document.body.appendChild( child );
		child.getBoundingClientRect = jest.fn( () => ( {
			width: 100,
			height: 100,
			top: childTop,
			left: childLeft,
		} ) );

		const rect = child.getBoundingClientRect();
		const offsettedRect = offsetIframe( rect, child.ownerDocument );

		expect( offsettedRect.left ).toBe( iframeLeft + childLeft );
		expect( offsettedRect.top ).toBe( iframeTop + childTop );
	} );
} );
