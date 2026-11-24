import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockRegisteredStore;
let mockCurrentContext;

vi.mock( import( '@wordpress/interactivity' ), () => ( {
	store: ( name, config ) => {
		mockRegisteredStore = config;
		return config;
	},
	getContext: () => mockCurrentContext,
	getElement: () => ( { ref: {} } ),
} ) );

describe( 'Accordion view script', () => {
	beforeEach( async () => {
		vi.resetModules();
		mockRegisteredStore = null;
		mockCurrentContext = null;
		await import( '../view.js' );
	} );

	it( 'does nothing when toggling an item that is not in accordionItems yet', () => {
		const { actions } = mockRegisteredStore;

		mockCurrentContext = {
			id: 'item-1',
			autoclose: false,
			accordionItems: [],
		};
		expect( () => actions.toggle() ).not.toThrow();

		mockCurrentContext = {
			id: 'item-1',
			autoclose: true,
			accordionItems: [ { id: 'item-2', isOpen: true } ],
		};
		expect( () => actions.toggle() ).not.toThrow();
		expect( mockCurrentContext.accordionItems ).toEqual( [
			{ id: 'item-2', isOpen: true },
		] );
	} );

	it( 'toggles an item that is in accordionItems', () => {
		const { actions } = mockRegisteredStore;

		mockCurrentContext = {
			id: 'item-1',
			autoclose: true,
			accordionItems: [
				{ id: 'item-1', isOpen: false },
				{ id: 'item-2', isOpen: true },
			],
		};
		actions.toggle();
		expect( mockCurrentContext.accordionItems ).toEqual( [
			{ id: 'item-1', isOpen: true },
			{ id: 'item-2', isOpen: false },
		] );
	} );
} );
