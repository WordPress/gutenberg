/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { act, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { LazyLoadCache } from '../cache';
import LazyLoad from '../lazy-load';
import { loadScripts } from '../script-loader';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../script-loader', () => ( {
	loadScripts: jest.fn( () => Promise.resolve() ),
} ) );

const FIXTURE_PROPS = Object.freeze( {
	a11yLoadingMessage: 'The FooBar block is loading.',
	a11yLoadedMessage: 'The FooBar block has loaded.',
	a11yLoadingFailedMessage: 'The FooBar block was unable to load.',
} );

const Child = () => (
	<div data-testid="test-child">What a wonderful child I am!</div>
);

const Placeholder = () => (
	<div data-testid="test-placeholder">
		What a wonderful child is loading...
	</div>
);

const getTree = ( props, method = shallow ) =>
	method(
		<LazyLoad { ...FIXTURE_PROPS } { ...props }>
			<Child />
		</LazyLoad>
	);

describe( 'LazyLoad', () => {
	let cache;

	beforeEach( () => {
		cache = new LazyLoadCache();
		jest.resetAllMocks();
	} );

	describe( 'loading', () => {
		it( 'should not attempt to load already loaded scripts', () => {
			cache.scripts.add( 'already-loaded' );
			const tree = getTree( { cache, scripts: [ 'already-loaded' ] } );
			expect( tree.find( Child ) ).toHaveLength( 1 );
			expect( loadScripts ).not.toHaveBeenCalled();
		} );

		it( 'should call onError when loading fails', async () => {
			const anError = new Error( 'an error' );
			loadScripts.mockRejectedValue( anError );
			const onError = jest.fn();

			await act( async () =>
				getTree(
					{
						cache,
						scripts: [ 'not-loaded' ],
						onError,
						onLoaded: () => {
							throw new Error( 'test failed' );
						},
					},
					render
				)
			);

			expect( onError ).toHaveBeenCalledWith( anError );
		} );

		it( 'should call onLoaded when loading succeeds', async () => {
			loadScripts.mockResolvedValue( undefined );
			const onLoaded = jest.fn();

			await act( async () =>
				getTree(
					{
						cache,
						scripts: [ 'not-loaded' ],
						onError: () => {
							throw new Error( 'test failed' );
						},
						onLoaded: () => {
							onLoaded();
						},
					},
					render
				)
			);

			expect( onLoaded ).toHaveBeenCalled();
		} );

		it( 'should render the placeholder while loading', async () => {
			let tree;
			act( () => {
				tree = getTree( {
					cache,
					scripts: [ 'not-loaded' ],
					placeholder: <Placeholder />,
				} );
			} );

			expect( tree.find( Placeholder ) ).toHaveLength( 1 );
		} );

		it( 'should render children after having loaded', async () => {
			loadScripts.mockResolvedValue( undefined );

			await act( async () => {
				getTree(
					{
						cache,
						scripts: [ 'not-loaded' ],
					},
					render
				);
			} );

			expect( await screen.findAllByTestId( 'test-child' ) ).toHaveLength(
				1
			);
		} );
	} );

	describe( 'a11y', () => {
		it( 'should not speak if nothing is loaded', () => {
			cache.scripts.add( 'already-loaded' );
			getTree( { cache, scripts: [ 'already-loaded' ] } );

			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'should speak the loading and error message when loading fails', async () => {
			const anError = new Error( 'an error' );
			loadScripts.mockRejectedValue( anError );

			await act( async () =>
				getTree(
					{
						cache,
						scripts: [ 'not-loaded' ],
					},
					render
				)
			);

			expect( speak ).toHaveBeenNthCalledWith(
				1,
				FIXTURE_PROPS.a11yLoadingMessage
			);

			expect( speak ).toHaveBeenNthCalledWith(
				2,
				FIXTURE_PROPS.a11yLoadingFailedMessage
			);

			expect( speak ).not.toHaveBeenCalledWith(
				FIXTURE_PROPS.a11yLoadedMessage
			);
		} );

		it( 'should speak the loading and loaded message when loading succeeds', async () => {
			loadScripts.mockResolvedValue( undefined );

			await act( async () =>
				getTree(
					{
						cache,
						scripts: [ 'not-loaded' ],
					},
					render
				)
			);

			expect( speak ).toHaveBeenNthCalledWith(
				1,
				FIXTURE_PROPS.a11yLoadingMessage
			);

			expect( speak ).toHaveBeenNthCalledWith(
				2,
				FIXTURE_PROPS.a11yLoadedMessage
			);

			expect( speak ).not.toHaveBeenCalledWith(
				FIXTURE_PROPS.a11yLoadingFailedMessage
			);
		} );
	} );
} );
