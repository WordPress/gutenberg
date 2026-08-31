import { getCollapsedLayout } from '../layout';

const BASE_METRICS = {
	availableWidth: 500,
	currentItemWidth: 30,
	linkItemWidths: [ 30, 80, 30 ],
	overflowTriggerWidth: 24,
	separatorWidth: 10,
};

describe( 'Breadcrumb responsive layout', () => {
	it( 'shows every item when the complete trail fits', () => {
		expect( getCollapsedLayout( BASE_METRICS ) ).toEqual( {
			collapsedIndices: [],
			shouldMoveFocusToOverflow: false,
			shouldTruncateCurrent: false,
		} );
	} );

	it( 'collapses one middle ancestor while preserving root and nearest items', () => {
		expect(
			getCollapsedLayout( { ...BASE_METRICS, availableWidth: 164 } )
				.collapsedIndices
		).toEqual( [ 1 ] );
	} );

	it( 'collapses several older middle ancestors first', () => {
		expect(
			getCollapsedLayout( {
				...BASE_METRICS,
				availableWidth: 164,
				linkItemWidths: [ 30, 70, 60, 30 ],
			} ).collapsedIndices
		).toEqual( [ 1, 2 ] );
	} );

	it( 'collapses the root when root, trigger, and current do not fit', () => {
		expect(
			getCollapsedLayout( {
				...BASE_METRICS,
				availableWidth: 84,
				linkItemWidths: [ 100, 20 ],
			} ).collapsedIndices
		).toEqual( [ 0, 1 ] );
	} );

	it( 'reconsiders a nearer ancestor after collapsing the root', () => {
		expect(
			getCollapsedLayout( {
				...BASE_METRICS,
				availableWidth: 114,
				linkItemWidths: [ 100, 20 ],
			} ).collapsedIndices
		).toEqual( [ 0 ] );
	} );

	it( 'keeps only the overflow trigger and current item when necessary', () => {
		const layout = getCollapsedLayout( {
			...BASE_METRICS,
			availableWidth: 84,
			linkItemWidths: [ 100, 20 ],
		} );

		expect( layout.collapsedIndices ).toEqual( [ 0, 1 ] );
		expect( layout.shouldTruncateCurrent ).toBe( false );
	} );

	it( 'truncates the current item only as a last resort', () => {
		expect(
			getCollapsedLayout( {
				...BASE_METRICS,
				availableWidth: 60,
				linkItemWidths: [ 100, 20 ],
			} ).shouldTruncateCurrent
		).toBe( true );
	} );

	it( 'restores all items when the container grows', () => {
		const narrow = getCollapsedLayout( {
			...BASE_METRICS,
			availableWidth: 164,
		} );
		const wide = getCollapsedLayout( BASE_METRICS );

		expect( narrow.collapsedIndices ).toEqual( [ 1 ] );
		expect( wide.collapsedIndices ).toEqual( [] );
	} );

	it( 'keeps a focused visible item pinned by collapsing another item', () => {
		const metrics = {
			...BASE_METRICS,
			availableWidth: 164,
			linkItemWidths: [ 30, 30, 100 ],
		};

		expect( getCollapsedLayout( metrics ).collapsedIndices ).toEqual( [
			1, 2,
		] );
		expect( getCollapsedLayout( metrics, 1 ).collapsedIndices ).toEqual( [
			2,
		] );
	} );

	it( 'requests a deliberate focus transfer when the pinned item cannot fit', () => {
		const layout = getCollapsedLayout(
			{
				...BASE_METRICS,
				availableWidth: 164,
				linkItemWidths: [ 30, 30, 100 ],
			},
			2
		);

		expect( layout.shouldMoveFocusToOverflow ).toBe( true );
		expect( layout.collapsedIndices ).toEqual( [ 1, 2 ] );
	} );

	it( 'uses a one-pixel tolerance at the fit boundary', () => {
		const layout = getCollapsedLayout( {
			...BASE_METRICS,
			availableWidth: 199.5,
			currentItemWidth: 30,
			linkItemWidths: [ 30, 80, 30 ],
			separatorWidth: 10,
		} );

		expect( layout.collapsedIndices ).toEqual( [] );
	} );

	it( 'does not collapse an otherwise-fitting trail based on item count', () => {
		const layout = getCollapsedLayout( {
			...BASE_METRICS,
			availableWidth: 1000,
			currentItemWidth: 10,
			linkItemWidths: Array.from( { length: 20 }, () => 10 ),
			separatorWidth: 1,
		} );

		expect( layout.collapsedIndices ).toEqual( [] );
	} );
} );
