/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

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

	function MergedRefs( {
		count,
		tagName: TagName = 'ul',
		disable1,
		disable2,
		unused,
	} ) {
		function refCallback1( value ) {
			refCallback1.history.push( value );
		}

		refCallback1.history = [];

		function refCallback2( value ) {
			refCallback2.history.push( value );
		}

		refCallback2.history = [];

		renderCallback( [ refCallback1.history, refCallback2.history ] );

		const ref1 = useCallback( refCallback1, [] );
		const ref2 = useCallback( refCallback2, [ count ] );
		const mergedRefs = useMergeRefs( [
			! disable1 && ref1,
			! disable2 && ref2,
		] );

		if ( unused ) {
			return <TagName ref={ ref1 } />;
		}

		return <TagName ref={ mergedRefs } />;
	}

	afterEach( () => {
		// Reset all history.
		renderCallback.history = [];
	} );

	it( 'should work', () => {
		const { rerender, unmount } = render( <MergedRefs /> );

		const originalElement = screen.getByRole( 'list' );

		// Render 1: both initial callback functions should be called with node.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		rerender( <MergedRefs /> );

		// Render 2: the new callback functions should not be called! There has
		// been no dependency change.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
			[ [], [] ],
		] );

		unmount();

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
		const { rerender, unmount } = render( <MergedRefs /> );

		const originalElement = screen.getByRole( 'list' );

		rerender( <MergedRefs tagName="button" /> );

		const newElement = screen.getByRole( 'button' );

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

		unmount();

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
		const { rerender, unmount } = render( <MergedRefs count={ 1 } /> );

		const originalElement = screen.getByRole( 'list' );

		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		rerender( <MergedRefs count={ 2 } /> );

		// After a second render with a dependency change, expect the inital
		// callback function to be called with null and the new callback
		// function to be called with the original node. Note that for callback
		// one no dependencies have changed.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement, null ] ],
			[ [], [ originalElement ] ],
		] );

		unmount();

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
		const { rerender, unmount } = render( <MergedRefs count={ 1 } /> );

		const originalElement = screen.getByRole( 'list' );

		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		rerender( <MergedRefs count={ 2 } tagName="button" /> );

		const newElement = screen.getByRole( 'button' );

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

		unmount();

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
		const { rerender, unmount } = render( <MergedRefs /> );

		const originalElement = screen.getByRole( 'list' );

		rerender( <MergedRefs tagName="button" /> );

		const newElement = screen.getByRole( 'button' );

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

		rerender( <MergedRefs tagName="button" count={ 1 } /> );

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

		unmount();

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

	it( 'should allow disabling a ref', () => {
		const { rerender, unmount } = render( <MergedRefs disable1 /> );

		const originalElement = screen.getByRole( 'list' );

		// Render 1: ref 1 should be disabled.
		expect( renderCallback.history ).toEqual( [
			[ [], [ originalElement ] ],
		] );

		rerender( <MergedRefs disable2 /> );

		// Render 2: ref 1 should be enabled and receive the ref. Note that the
		// callback hasn't changed, so the original callback function will be
		// called. Ref 2 should be disabled, so called with null.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement, null ] ],
			[ [], [] ],
		] );

		rerender( <MergedRefs disable1 count={ 1 } /> );

		// Render 3: ref 1 should again be disabled. Ref 2 to should receive a
		// ref with the new callback function because the count has been
		// changed.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null ],
				[ originalElement, null ],
			],
			[ [], [] ],
			[ [], [ originalElement ] ],
		] );

		unmount();

		// Unmount: current callback functions should receive null.
		expect( renderCallback.history ).toEqual( [
			[
				[ originalElement, null ],
				[ originalElement, null ],
			],
			[ [], [] ],
			[ [], [ originalElement, null ] ],
		] );
	} );

	it( 'should allow the hook being unused', () => {
		const { rerender } = render( <MergedRefs unused /> );

		const originalElement = screen.getByRole( 'list' );

		// Render 1: ref 1 should updated, ref 2 should not.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [] ],
		] );

		rerender( <MergedRefs /> );

		// Render 2: ref 2 should be updated as well.
		expect( renderCallback.history ).toEqual( [
			[ [ originalElement, null, originalElement ], [ originalElement ] ],
			[ [], [] ],
		] );

		rerender( <MergedRefs unused /> );

		// Render 3: ref 2 should be updated with null
		expect( renderCallback.history ).toEqual( [
			[
				[
					originalElement,
					null,
					originalElement,
					null,
					originalElement,
				],
				[ originalElement, null ],
			],
			[ [], [] ],
			[ [], [] ],
		] );
	} );
} );
