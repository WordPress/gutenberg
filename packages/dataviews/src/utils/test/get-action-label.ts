import { afterEach, describe, expect, it } from 'vitest';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';
import type { Action } from '../../types';
import getActionLabel from '../get-action-label';

const items = [ { id: 1 }, { id: 2 } ];
const modalAction: Action< ( typeof items )[ number ] > = {
	id: 'delete',
	label: 'Delete',
	RenderModal: () => createElement( 'div' ),
};

afterEach( () => resetLocaleData() );

describe( 'action labels', () => {
	it( 'adds an ellipsis to modal menu items without changing the action label', () => {
		expect( getActionLabel( modalAction, items, 'menu' ) ).toBe(
			'Delete…'
		);
		expect( getActionLabel( modalAction, items ) ).toBe( 'Delete' );
		expect( modalAction.label ).toBe( 'Delete' );
	} );

	it( 'uses the translated punctuation and spacing around a function label', () => {
		setLocaleData( {
			'menu item requiring further input\u0004%s…': [ '⋯ %s' ],
		} );
		const action = {
			...modalAction,
			label: ( selected: typeof items ) => `Delete ${ selected.length }`,
		};
		expect( getActionLabel( action, items, 'menu' ) ).toBe( '⋯ Delete 2' );
		expect( getActionLabel( action, items ) ).toBe( 'Delete 2' );
	} );

	it( 'keeps callback menu labels unchanged', () => {
		const action = { id: 'view', label: 'View', callback: () => {} };
		expect( getActionLabel( action, items, 'menu' ) ).toBe( 'View' );
	} );

	it.each( [
		'Delete…',
		'Delete……',
		'Delete⋯',
		'Delete...',
		'Delete......',
		'Delete。。。',
		'Delete．．．',
		'Delete …\u00a0',
		'Delete\u00a0⋯⋯ ',
	] )(
		'preserves the legacy menu label "%s" and removes its ellipsis on buttons',
		( label ) => {
			const action = { ...modalAction, label };
			expect( getActionLabel( action, items, 'menu' ) ).toBe( label );
			expect( getActionLabel( action, items ) ).toBe( 'Delete' );
		}
	);

	it.each( [
		'Delete.',
		'Delete..',
		'Delete… item',
		'  Delete  ',
		`Delete ${ '.'.repeat( 100 ) } item`,
	] )(
		'keeps button label "%s" unchanged when it has no recognized trailing ellipsis',
		( label ) => {
			expect( getActionLabel( { ...modalAction, label }, items ) ).toBe(
				label
			);
		}
	);
} );
