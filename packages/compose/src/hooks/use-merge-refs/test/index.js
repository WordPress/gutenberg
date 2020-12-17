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
	beforeAll( () => {
		const rootElement = document.createElement( 'div' );
		rootElement.id = 'root';
		document.body.appendChild( rootElement );
	} );

	it( 'should work', () => {
		const renderCallback = jest.fn();
		const refCallback1 = jest.fn();

		function MergedRefs() {
			renderCallback();
			return (
				<div
					ref={ useMergeRefs( [ useCallback( refCallback1, [] ) ] ) }
				/>
			);
		}

		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		expect( renderCallback ).toHaveBeenCalledTimes( 1 );
		expect( refCallback1 ).toHaveBeenCalledTimes( 1 );
		expect( refCallback1 ).toHaveBeenCalledWith(
			rootElement.firstElementChild
		);

		ReactDOM.render( <MergedRefs />, rootElement );

		expect( renderCallback ).toHaveBeenCalledTimes( 2 );
		expect( refCallback1 ).toHaveBeenCalledTimes( 1 );
		expect( refCallback1 ).toHaveBeenCalledWith(
			rootElement.firstElementChild
		);
	} );

	it( 'should work with 2', () => {
		const refCallback1 = jest.fn();
		const refCallback2 = jest.fn();

		function MergedRefs() {
			return (
				<div
					ref={ useMergeRefs( [
						useCallback( refCallback1, [] ),
						useCallback( refCallback2, [] ),
					] ) }
				/>
			);
		}

		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		expect( refCallback1 ).toHaveBeenCalledTimes( 1 );
		expect( refCallback1 ).toHaveBeenCalledWith(
			rootElement.firstElementChild
		);
		expect( refCallback2 ).toHaveBeenCalledTimes( 1 );
		expect( refCallback2 ).toHaveBeenCalledWith(
			rootElement.firstElementChild
		);
	} );

	it( 'should work for node change', () => {
		const renderCallback = jest.fn();

		function refCallback1( value ) {
			refCallback1.history = refCallback1.history || [];
			refCallback1.history.push( value );
		}

		function MergedRefs( { tagName: TagName = 'div' } ) {
			renderCallback();
			return (
				<TagName
					ref={ useMergeRefs( [ useCallback( refCallback1, [] ) ] ) }
				/>
			);
		}

		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		const originalElement = rootElement.firstElementChild;

		expect( renderCallback ).toHaveBeenCalledTimes( 1 );
		expect( refCallback1.history ).toEqual( [ originalElement ] );

		ReactDOM.render( <MergedRefs tagName="button" />, rootElement );

		expect( renderCallback ).toHaveBeenCalledTimes( 2 );
		expect( refCallback1.history ).toEqual( [
			originalElement,
			null,
			rootElement.firstElementChild,
		] );
	} );

	it( 'should work with 2 different deps', () => {
		function renderCallback( args ) {
			renderCallback.history.push( args );
		}

		renderCallback.history = [];

		function MergedRefs( { count } ) {
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
				<div
					ref={ useMergeRefs( [
						useCallback( refCallback1, [] ),
						useCallback( refCallback2, [ count ] ),
					] ) }
				/>
			);
		}

		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs count={ 1 } />, rootElement );

		const originalElement = rootElement.firstElementChild;

		expect( renderCallback.history ).toEqual( [
			[ [ originalElement ], [ originalElement ] ],
		] );

		ReactDOM.render( <MergedRefs count={ 2 } />, rootElement );

		expect( renderCallback.history ).toEqual( [
			[
				// Expect the "old" callback 1 to be called with the node.
				[ originalElement ],
				// Expect the "old" callback 2 to be called with the node, then
				// `null`.
				[ originalElement, null ],
			],
			[
				// Don't expect the "new" callback 1 to be called.
				// No dependencies or node have changed.
				[],
				// Expect the "new" callback 2 to be called with the node since
				// a dependency has updated.
				[ originalElement ],
			],
		] );
	} );

	it( 'should simultaneously update node and dependencies', () => {
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

		expect( renderCallback.history ).toEqual( [
			[
				// Expect the "old" callback 1 to be called with the node,
				// then null and then the new node.
				[ originalElement, null, rootElement.firstElementChild ],
				// Expect the "old" callback 2 to be called with the node, then
				// `null`.
				[ originalElement, null ],
			],
			[
				// Don't expect the "new" callback 1 to be called since
				// No dependencies or node have changed.
				[],
				// Expect the "new" callback 2 to be called with the node since
				// a dependency has updated.
				[ rootElement.firstElementChild ],
			],
		] );
	} );

	it( 'should unmount', () => {
		function renderCallback( args ) {
			renderCallback.history.push( args );
		}

		renderCallback.history = [];

		function MergedRefs() {
			function refCallback1( value ) {
				refCallback1.history.push( value );
			}

			refCallback1.history = [];

			renderCallback( [ refCallback1.history ] );

			return (
				<div
					ref={ useMergeRefs( [ useCallback( refCallback1, [] ) ] ) }
				/>
			);
		}

		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <MergedRefs />, rootElement );

		const originalElement = rootElement.firstElementChild;

		expect( renderCallback.history ).toEqual( [ [ [ originalElement ] ] ] );

		ReactDOM.render( null, rootElement );

		expect( renderCallback.history ).toEqual( [
			[
				// Expect the "old" callback 1 to be called with the node,
				// then null and then the new node.
				[ originalElement, null ],
			],
		] );
	} );
} );
