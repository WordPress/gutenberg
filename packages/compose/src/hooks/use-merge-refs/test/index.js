/**
 * External dependencies
 */
import ReactDOM from 'react-dom';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMergeRefs from '../';

describe( 'useMergeRefs', () => {
	// Setup
	// =====
	//
	// A component with two merged ref callbacks. The second has a dependency,
	// the first does not. We expect the one with the dependency to be called
	// with null in the old function and the node in the new function. We don't
	// expect the first ref callback to be called **unless** the node changes.
	// There's a prop controlling the tag name, which can be used to trigger a
	// node change. In that case we expect both ref callbacks to be called with
	// null in the old function and the **new** node in the new function.
	//
	// The history of all functions is recorded. Note that a new function is
	// created on every render, which will all be tracked. Some functions are
	// never expected to be called on subsequent renders if no callback
	// dependency updates!

	function renderCallback( args ) {
		renderCallback.history.push( args );
	}

	renderCallback.history = [];

	function MergedRefs( { count, tagName: TagName = 'div' } ) {
		function refCallback1( value ) {
			refCallback1.history.push( value );
		}

		refCallback1.history = [];

		function refCallback2( value ) {
			refCallback2.history.push( value );
		}

		refCallback2.history = [];

		renderCallback( [ refCallback1.history, refCallback2.history ] );

		return (
			<TagName
				ref={ useMergeRefs( [
					useCallback( refCallback1, [] ),
					useCallback( refCallback2, [ count ] ),
				] ) }
			/>
		);
	}

	beforeEach( () => {
		const rootElement = document.createElement( 'div' );
		rootElement.id = 'root';
		document.body.appendChild( rootElement );
	} );

	afterEach( () => {
		// Reset all history and DOM.
		renderCallback.history = [];
		document.body.innerHTML = '';
	} );

	it( 'should work', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		const originalElement = rootElement.firstElementChild;

		// Render 1: both initial callback functions should be called with node.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		ReactDOM.render( <MergedRefs />, rootElement );

		// Render 2: the new callback functions should not be called! There has
		// been no dependency change.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
			[ [], [] ],
		] );

		ReactDOM.render( null, rootElement );

		// Unmount: the initial callback functions should receive null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null ],
				[ originalElement, null ],
			],
			[ [], [] ],
		] );
	} );

	it( 'should work for node change', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		const originalElement = rootElement.firstElementChild;

		ReactDOM.render( <MergedRefs tagName="button" />, rootElement );

		const newElement = rootElement.firstElementChild;

		// After a render with the original element and a second render with the
		// new element, expect the initial callback functions to be called with
		// the original element, then null, then the new element.
		// Again, the new callback functions should not be called! There has
		// been no dependency change.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement ],
				[ originalElement, null, newElement ],
			],
			[ [], [] ],
		] );

		ReactDOM.render( null, rootElement );

		// Unmount: the initial callback functions should receive null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement, null ],
				[ originalElement, null, newElement, null ],
			],
			[ [], [] ],
		] );
	} );

	it( 'should work with dependencies', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs count={ 1 } />, rootElement );

		const originalElement = rootElement.firstElementChild;

		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		ReactDOM.render( <MergedRefs count={ 2 } />, rootElement );

		// After a second render with a dependency change, expect the inital
		// callback function to be called with null and the new callback
		// function to be called with the original node. Note that for callback
		// one no dependencies have changed.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement, null ] ],
			[ [], [ originalElement ] ],
		] );

		ReactDOM.render( null, rootElement );

		// Unmount: current callback functions should be called with null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null ],
				[ originalElement, null ],
			],
			[ [], [ originalElement, null ] ],
		] );
	} );

	it( 'should simultaneously update node and dependencies', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs count={ 1 } />, rootElement );

		const originalElement = rootElement.firstElementChild;

		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		ReactDOM.render(
			<MergedRefs count={ 2 } tagName="button" />,
			rootElement
		);

		const newElement = rootElement.firstElementChild;

		// Both the node changes and the dependencies update for the second
		// callback, so expect the old callback function to be called with null
		// and the new callback function to be called with the **new** node.
		// For the first callback, we expect the initial function to be called
		// with null and then the new node since no dependencies have changed.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement ],
				[ originalElement, null ],
			],
			[ [], [ newElement ] ],
		] );

		ReactDOM.render( null, rootElement );

		// Unmount: current callback functions should be called with null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement, null ],
				[ originalElement, null ],
			],
			[ [], [ newElement, null ] ],
		] );
	} );

	it( 'should work for dependency change after node change', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		const originalElement = rootElement.firstElementChild;

		ReactDOM.render( <MergedRefs tagName="button" />, rootElement );

		const newElement = rootElement.firstElementChild;

		// After a render with the original element and a second render with the
		// new element, expect the initial callback functions to be called with
		// the original element, then null, then the new element.
		// Again, the new callback functions should not be called! There has
		// been no dependency change.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement ],
				[ originalElement, null, newElement ],
			],
			[ [], [] ],
		] );

		ReactDOM.render(
			<MergedRefs tagName="button" count={ 1 } />,
			rootElement
		);

		// After a third render with a dependency change, expect the inital
		// callback function to be called with null and the new callback
		// function to be called with the new element. Note that for callback
		// one no dependencies have changed.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement ],
				[ originalElement, null, newElement, null ],
			],
			[ [], [] ],
			[ [], [ newElement ] ],
		] );

		ReactDOM.render( null, rootElement );

		// Unmount: current callback functions should be called with null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null, newElement, null ],
				[ originalElement, null, newElement, null ],
			],
			[ [], [] ],
			[ [], [ newElement, null ] ],
		] );
	} );
} );
