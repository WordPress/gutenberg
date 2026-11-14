import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';
import { useState } from '@wordpress/element';
import withFilters from '..';

describe( 'withFilters', () => {
	const hookName = 'EnhancedComponent';
	const MyComponent = () => <div>My component</div>;

	afterEach( () => {
		vi.useRealTimers();
		removeAllFilters( hookName, 'test/enhanced-component-override' );
		removeAllFilters( hookName, 'test/enhanced-component-compose' );
		removeAllFilters( hookName, 'test/enhanced-component-spy' );
		removeAllFilters( hookName, 'test/enhanced-component-spy-1' );
		removeAllFilters( hookName, 'test/enhanced-component-spy-2' );
	} );

	it( 'reports overlay support from the renderer selected for its actual original component', () => {
		const Original = Object.assign( () => <span>Original</span>, {
			supportsUiOverlays: true,
		} );
		const Enhanced = withFilters( hookName )( Original );
		expect( Enhanced.supportsUiOverlays ).toBe( true );
		addFilter(
			hookName,
			'test/enhanced-component-override',
			( component ) =>
				component === Original
					? () => <span>Replacement</span>
					: Original
		);
		expect( Enhanced.supportsUiOverlays ).toBe( false );
		render( <Enhanced /> );
		expect( screen.getByText( 'Replacement' ) ).toBeVisible();
	} );

	it( 'does not freeze a renderer when support is checked before mounting', () => {
		const Original = Object.assign( () => null, {
			supportsUiOverlays: true,
		} );
		const Enhanced = withFilters( hookName )( Original );
		expect( Enhanced.supportsUiOverlays ).toBe( true );
		addFilter( hookName, 'test/enhanced-component-override', () => () => (
			<span>Later replacement</span>
		) );
		render( <Enhanced /> );
		expect( screen.getByText( 'Later replacement' ) ).toBeVisible();
		expect( Enhanced.supportsUiOverlays ).toBe( false );
	} );

	it( 'notifies overlay hosts of renderer changes before a control mounts', () => {
		vi.useFakeTimers();
		const Original = Object.assign( () => null, {
			supportsUiOverlays: true,
		} );
		const Enhanced = withFilters( hookName )( Original );
		const onChange = vi.fn();
		const unsubscribe = Enhanced.subscribeUiOverlaySupport( onChange );
		addFilter(
			hookName,
			'test/enhanced-component-override',
			() => () => null
		);
		vi.advanceTimersByTime( 16 );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( Enhanced.supportsUiOverlays ).toBe( false );
		unsubscribe();
		removeFilter( hookName, 'test/enhanced-component-override' );
		vi.advanceTimersByTime( 16 );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( Enhanced.supportsUiOverlays ).toBe( true );
	} );

	it( 'forwards support changes owned by the selected renderer', () => {
		let supported = true;
		const listeners = new Set< () => void >();
		const Original = Object.assign( () => null, {
			subscribeUiOverlaySupport: ( listener: () => void ) => {
				listeners.add( listener );
				return () => listeners.delete( listener );
			},
		} );
		Object.defineProperty( Original, 'supportsUiOverlays', {
			get: () => supported,
		} );
		const Enhanced = withFilters( hookName )( Original );
		const onChange = vi.fn();
		const unsubscribe = Enhanced.subscribeUiOverlaySupport( onChange );
		expect( Enhanced.supportsUiOverlays ).toBe( true );
		supported = false;
		listeners.forEach( ( listener ) => listener() );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( Enhanced.supportsUiOverlays ).toBe( false );
		unsubscribe();
		expect( listeners.size ).toBe( 0 );
	} );

	it( 'keeps separate controls subscribed to the same filter hook', () => {
		vi.useFakeTimers();
		const Original = Object.assign( () => null, {
			supportsUiOverlays: true,
		} );
		const First = withFilters( hookName )( Original );
		const Second = withFilters( hookName )( Original );
		const firstChanged = vi.fn();
		const secondChanged = vi.fn();
		const firstUnsubscribe =
			First.subscribeUiOverlaySupport( firstChanged );
		const secondUnsubscribe =
			Second.subscribeUiOverlaySupport( secondChanged );
		try {
			addFilter(
				hookName,
				'test/enhanced-component-override',
				() => () => null
			);
			vi.advanceTimersByTime( 16 );
			expect( firstChanged ).toHaveBeenCalledTimes( 1 );
			expect( secondChanged ).toHaveBeenCalledTimes( 1 );
			firstUnsubscribe();
			removeFilter( hookName, 'test/enhanced-component-override' );
			vi.advanceTimersByTime( 16 );
			expect( firstChanged ).toHaveBeenCalledTimes( 1 );
			expect( secondChanged ).toHaveBeenCalledTimes( 2 );
		} finally {
			firstUnsubscribe();
			secondUnsubscribe();
		}
	} );

	it( 'preserves renderer state when the final mounted instance is replaced in one commit', () => {
		const Counter = () => {
			const [ count, setCount ] = useState( 0 );
			return (
				<button onClick={ () => setCount( count + 1 ) }>
					{ count }
				</button>
			);
		};
		addFilter(
			hookName,
			'test/enhanced-component-override',
			( Wrapped ) => () => <Wrapped />
		);
		const Enhanced = withFilters( hookName )( Counter );
		const { rerender } = render( <Enhanced key="first" /> );
		rerender( <Enhanced key="second" /> );
		fireEvent.click( screen.getByRole( 'button', { name: '0' } ) );
		rerender( <Enhanced key="second" /> );
		expect( screen.getByRole( 'button', { name: '1' } ) ).toBeVisible();
	} );

	it( 'applies a queued filter update when the final instance is replaced', () => {
		vi.useFakeTimers();
		const Original = Object.assign( () => <span>Original content</span>, {
			supportsUiOverlays: true,
		} );
		const Enhanced = withFilters( hookName )( Original );
		const { rerender } = render( <Enhanced key="first" /> );
		addFilter( hookName, 'test/enhanced-component-override', () => () => (
			<span>Updated content</span>
		) );
		rerender( <Enhanced key="second" /> );
		act( () => vi.advanceTimersByTime( 16 ) );
		expect( screen.getByText( 'Updated content' ) ).toBeVisible();
		expect( Enhanced.supportsUiOverlays ).toBe( false );
	} );

	it( 'does not reapply an update already consumed by an inactive remount', () => {
		vi.useFakeTimers();
		const Counter = () => {
			const [ count, setCount ] = useState( 0 );
			return (
				<button onClick={ () => setCount( count + 1 ) }>
					{ count }
				</button>
			);
		};
		const Enhanced = withFilters( hookName )( Counter );
		const { unmount } = render( <Enhanced /> );
		addFilter(
			hookName,
			'test/enhanced-component-override',
			( Wrapped ) => () => <Wrapped />
		);
		unmount();
		render( <Enhanced /> );
		fireEvent.click( screen.getByRole( 'button', { name: '0' } ) );
		act( () => vi.advanceTimersByTime( 16 ) );
		expect( screen.getByRole( 'button', { name: '1' } ) ).toBeVisible();
	} );

	it( 'should display original component when no filters applied', () => {
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should display a component overridden by the filter', () => {
		const OverriddenComponent = () => <div>Overridden component</div>;
		addFilter(
			'EnhancedComponent',
			'test/enhanced-component-override',
			() => OverriddenComponent
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should display two components composed by the filter', () => {
		const ComposedComponent = () => <div>Composed component</div>;
		addFilter(
			hookName,
			'test/enhanced-component-compose',
			( FilteredComponent ) => () => (
				<div>
					<FilteredComponent />
					<ComposedComponent />
				</div>
			)
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not re-render component when new filter added before component was mounted', async () => {
		const SpiedComponent = vi.fn( () => <div>Spied component</div> );
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 1 )
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component once when new filter added after component was mounted', async () => {
		const SpiedComponent = vi.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 1 )
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component once when two filters added in the same animation frame', async () => {
		const SpiedComponent = vi.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		addFilter(
			hookName,
			'test/enhanced-component-spy-2',
			( FilteredComponent ) => () => (
				<section>
					<FilteredComponent />
				</section>
			)
		);

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 1 )
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component twice when new filter added and removed in two different animation frames', async () => {
		const SpiedComponent = vi.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy',
			( FilteredComponent ) => () => (
				<div>
					<FilteredComponent />
				</div>
			)
		);

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 1 )
		);

		removeFilter( hookName, 'test/enhanced-component-spy' );

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 2 )
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render both components once each when one filter added', async () => {
		const SpiedComponent = vi.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const CombinedComponents = () => (
			<section>
				<EnhancedComponent />
				<EnhancedComponent />
			</section>
		);
		const { container } = render( <CombinedComponents /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);

		await waitFor( () =>
			expect( SpiedComponent ).toHaveBeenCalledTimes( 2 )
		);
		expect( container ).toMatchSnapshot();
	} );
} );
