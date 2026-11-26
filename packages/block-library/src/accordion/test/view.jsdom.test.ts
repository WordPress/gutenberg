import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { getContext, getElement, store } from '@wordpress/interactivity';

type AccordionContext = {
	id: string;
	autoclose: boolean;
	accordionItems: { id: string; isOpen: boolean }[];
};

let mockRegisteredStore: { actions: { toggle: () => void } };
let mockCurrentContext: AccordionContext;

vi.mock( import( '@wordpress/interactivity' ), () => ( {
	store: ( ( name: string, config: typeof mockRegisteredStore ) => {
		mockRegisteredStore = config;
		return config;
	} ) as unknown as typeof store,
	getContext: ( () => mockCurrentContext ) as typeof getContext,
	getElement: ( () => ( { ref: {} } ) ) as unknown as typeof getElement,
} ) );

describe( 'Accordion view script', () => {
	beforeEach( async () => {
		vi.resetModules();
		await vi.importActual( '../view' );
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
