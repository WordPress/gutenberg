/**
 * Internal dependencies
 */
import {
	registerLayout,
	getRegisteredLayout,
	getRegisteredLayouts,
	__clearRegisteredLayouts,
} from '../registry';

describe( 'registerLayout', () => {
	afterEach( () => {
		__clearRegisteredLayouts();
	} );

	it( 'stores the layout so it can be retrieved by type', () => {
		const Component = () => null;

		registerLayout( {
			type: 'pocCardRows',
			label: 'POC card rows',
			component: Component,
		} );

		const retrieved = getRegisteredLayout( 'pocCardRows' );
		expect( retrieved?.type ).toBe( 'pocCardRows' );
		expect( retrieved?.label ).toBe( 'POC card rows' );
		expect( retrieved?.component ).toBe( Component );
	} );

	it( 'returns every registered layout from getRegisteredLayouts', () => {
		const A = () => null;
		const B = () => null;

		registerLayout( { type: 'pocA', label: 'A', component: A } );
		registerLayout( { type: 'pocB', label: 'B', component: B } );

		const all = getRegisteredLayouts();
		expect( all ).toHaveLength( 2 );
		expect( all.map( ( l ) => l.type ).sort() ).toEqual( [
			'pocA',
			'pocB',
		] );
	} );

	it.each( [
		'table',
		'grid',
		'list',
		'activity',
		'pickerGrid',
		'pickerTable',
	] )( 'throws when the type collides with built-in %s', ( builtInType ) => {
		const Component = () => null;

		expect( () =>
			registerLayout( {
				type: builtInType,
				label: 'x',
				component: Component,
			} )
		).toThrow( /built-in/i );
	} );

	it( 'throws when the same type is registered twice', () => {
		const First = () => null;
		const Second = () => null;

		registerLayout( {
			type: 'pocDuplicate',
			label: 'first',
			component: First,
		} );

		expect( () =>
			registerLayout( {
				type: 'pocDuplicate',
				label: 'second',
				component: Second,
			} )
		).toThrow( /already registered/i );
	} );

	// Skipped: mounting DataViewsLayout pulls in @wordpress/components →
	// @wordpress/compose → 'clipboard' transitively. A clean worktree
	// checkout without `npm install` can't resolve those. CI runs with a
	// full install so this will execute there. The Storybook story is the
	// interactive equivalent during local development.
	//
	// The heavy imports are inside the test body so the file is still
	// loadable without them at parse time.
	it.skip( 'renders the registered component when view.type matches', async () => {
		const { render, screen } = await import( '@testing-library/react' );
		const { createRef } = await import( 'react' );
		const DataViewsContext = (
			await import( '../../dataviews-context' )
		).default;
		const DataViewsLayout = (
			await import( '../../dataviews-layout' )
		).default;

		function CustomLayout() {
			return <div data-testid="poc-card-rows-output">custom layout</div>;
		}

		registerLayout( {
			type: 'pocCardRows',
			label: 'POC card rows',
			component: CustomLayout,
		} );

		const contextValue = {
			view: { type: 'pocCardRows' },
			onChangeView: () => {},
			fields: [],
			data: [],
			paginationInfo: { totalItems: 0, totalPages: 0 },
			selection: [],
			onChangeSelection: () => {},
			setOpenedFilter: () => {},
			openedFilter: null,
			getItemId: ( item: any ) => String( item.id ),
			isItemClickable: () => true,
			containerWidth: 0,
			containerRef: createRef< HTMLDivElement >(),
			resizeObserverRef: () => {},
			// Deliberately empty: a registered layout must resolve even when
			// the consumer has not added its type to defaultLayouts.
			defaultLayouts: {},
			filters: [],
			isShowingFilter: false,
			setIsShowingFilter: () => {},
			hasInfiniteScrollHandler: false,
			config: { perPageSizes: [] },
		};

		render(
			<DataViewsContext.Provider value={ contextValue as any }>
				<DataViewsLayout />
			</DataViewsContext.Provider>
		);

		expect(
			screen.getByTestId( 'poc-card-rows-output' )
		).toHaveTextContent( 'custom layout' );
	} );
} );
