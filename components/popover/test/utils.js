/**
 * Internal dependencies
 */
import { computePopoverPosition } from '../utils';

describe( 'computePopoverPosition', () => {
	it( 'should leave the position as is there\'s enought space', () => {
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

		expect( computePopoverPosition( anchorRect, contentSize, 'bottom right' ) ).toEqual( {
			contentHeight: null,
			contentWidth: null,
			isMobile: false,
			popoverLeft: 20,
			popoverTop: 30,
			xAxis: 'right',
			yAxis: 'bottom',
		} );
	} );

	it( 'should switch to bottom position if there\'s not enough space', () => {
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

		expect( computePopoverPosition( anchorRect, contentSize, 'top right' ) ).toEqual( {
			contentHeight: null,
			contentWidth: null,
			isMobile: false,
			popoverLeft: 20,
			popoverTop: 30,
			xAxis: 'right',
			yAxis: 'bottom',
		} );
	} );

	it( 'should switch to rights position if there\'s not enough space', () => {
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

		expect( computePopoverPosition( anchorRect, contentSize, 'top center' ) ).toEqual( {
			contentHeight: null,
			contentWidth: null,
			isMobile: false,
			popoverLeft: 20,
			popoverTop: 30,
			xAxis: 'right',
			yAxis: 'bottom',
		} );
	} );

	it( 'should set a maxHeight if there\'s not enough space in any direction', () => {
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

		expect( computePopoverPosition( anchorRect, contentSize, 'right bottom' ) ).toEqual( {
			contentHeight: 390,
			contentWidth: null,
			isMobile: false,
			popoverLeft: 20,
			popoverTop: 400,
			xAxis: 'right',
			yAxis: 'top',
		} );
	} );

	it( 'should set a maxWidth if there\'s not enough space in any direction', () => {
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

		expect( computePopoverPosition( anchorRect, contentSize, 'right bottom' ) ).toEqual( {
			contentHeight: null,
			contentWidth: 614,
			isMobile: false,
			popoverLeft: 410,
			popoverTop: 30,
			xAxis: 'right',
			yAxis: 'bottom',
		} );
	} );
} );
