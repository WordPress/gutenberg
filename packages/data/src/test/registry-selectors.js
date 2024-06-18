/**
 * Internal dependencies
 */
import { createRegistry } from '../registry';
import { createRegistrySelector } from '../factory';
import { createSelector } from '..';
import createReduxStore from '../redux-store';

const getElementCount = createRegistrySelector( ( select ) => () => {
	return select( 'elements' ).getElements().length;
} );

const getFilterValue = ( state ) => state;

const getFilteredElements = createRegistrySelector( ( select ) =>
	createSelector(
		( state ) => {
			const filter = getFilterValue( state );
			const elements = select( 'elements' ).getElements();
			if ( ! filter ) {
				return elements;
			}
			return elements.filter( ( el ) => el.startsWith( filter ) );
		},
		( state ) => [
			select( 'elements' ).getElements(),
			getFilterValue( state ),
		]
	)
);

const elementsStore = createReduxStore( 'elements', {
	reducer( state = [], action ) {
		if ( action.type === 'ADD' ) {
			return [ ...state, ...action.elements ];
		}
		return state;
	},
	actions: {
		add: ( ...elements ) => ( { type: 'ADD', elements } ),
	},
	selectors: {
		getElements: ( state ) => state,
	},
} );

const uiStore = createReduxStore( 'ui', {
	reducer( state = '', action ) {
		if ( action.type === 'FILTER' ) {
			return action.value;
		}
		return state;
	},
	actions: {
		filter: ( value ) => ( { type: 'FILTER', value } ),
	},
	selectors: {
		getFilterValue,
		getElementCount,
		getFilteredElements,
	},
} );

describe( 'createRegistrySelector', () => {
	it( 'can bind one selector to a registry', () => {
		const registry = createRegistry();
		registry.register( elementsStore );
		registry.register( uiStore );

		expect( registry.select( uiStore ).getElementCount() ).toBe( 0 );

		registry.dispatch( elementsStore ).add( 'Carbon' );

		expect( registry.select( uiStore ).getElementCount() ).toBe( 1 );
	} );

	it( 'can bind one selector to multiple registries (createRegistrySelector)', () => {
		const registry1 = createRegistry();
		const registry2 = createRegistry();

		registry1.register( elementsStore );
		registry1.register( uiStore );
		registry2.register( elementsStore );
		registry2.register( uiStore );

		expect( registry1.select( uiStore ).getElementCount() ).toBe( 0 );
		expect( registry2.select( uiStore ).getElementCount() ).toBe( 0 );

		registry1.dispatch( elementsStore ).add( 'Carbon' );

		expect( registry1.select( uiStore ).getElementCount() ).toBe( 1 );
		expect( registry2.select( uiStore ).getElementCount() ).toBe( 0 );

		registry2.dispatch( elementsStore ).add( 'Helium' );

		expect( registry1.select( uiStore ).getElementCount() ).toBe( 1 );
		expect( registry2.select( uiStore ).getElementCount() ).toBe( 1 );
	} );

	it( 'can bind one selector to multiple registries (createRegistrySelector + createSelector)', () => {
		const registry1 = createRegistry();
		registry1.register( elementsStore );
		registry1.register( uiStore );
		registry1.dispatch( elementsStore ).add( 'Carbon' );

		const registry2 = createRegistry();
		registry2.register( elementsStore );
		registry2.register( uiStore );
		registry2.dispatch( elementsStore ).add( 'Helium' );

		// Expects the `getFilteredElements` to be bound separately and independently to the two registries
		expect( registry1.select( uiStore ).getFilteredElements() ).toEqual( [
			'Carbon',
		] );
		expect( registry2.select( uiStore ).getFilteredElements() ).toEqual( [
			'Helium',
		] );
	} );

	it( 'can bind a memoized selector to a registry', () => {
		const registry = createRegistry();
		registry.register( elementsStore );
		registry.register( uiStore );

		registry.dispatch( elementsStore ).add( 'Carbon', 'Nitrogen' );
		registry.dispatch( uiStore ).filter( 'Ca' );

		// check that `getFilteredElements` return value is a memoized array
		const elements1 = registry.select( uiStore ).getFilteredElements();
		expect( elements1 ).toEqual( [ 'Carbon' ] );
		const elements2 = registry.select( uiStore ).getFilteredElements();
		expect( elements2 ).toBe( elements1 ); // memoized

		// check that adding a new element triggers recalculation
		registry.dispatch( elementsStore ).add( 'Calcium' );

		const elements3 = registry.select( uiStore ).getFilteredElements();
		expect( elements3 ).toEqual( [ 'Carbon', 'Calcium' ] );
		const elements4 = registry.select( uiStore ).getFilteredElements();
		expect( elements4 ).toBe( elements3 ); // memoized

		// check that changing the filter triggers recalculation
		registry.dispatch( uiStore ).filter( 'Ni' );

		const elements5 = registry.select( uiStore ).getFilteredElements();
		expect( elements5 ).toEqual( [ 'Nitrogen' ] );
		const elements6 = registry.select( uiStore ).getFilteredElements();
		expect( elements6 ).toBe( elements5 ); // memoized
	} );
} );
