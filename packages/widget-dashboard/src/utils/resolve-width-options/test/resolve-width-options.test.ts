import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	resolveWidthOptions,
	toItemResizeWidths,
} from '../resolve-width-options';
import type { DashboardWidthOption } from '../../../types';

const warningMock = vi.hoisted( () => vi.fn() );

vi.mock( import( '@wordpress/warning' ), () => ( {
	default: warningMock,
} ) );

describe( 'resolveWidthOptions', () => {
	beforeEach( () => {
		warningMock.mockClear();
	} );

	it( 'keeps the default behavior when no choices are supplied', () => {
		expect( resolveWidthOptions( undefined, 'grid' ) ).toEqual( {
			kind: 'default',
		} );
		expect( warningMock ).not.toHaveBeenCalled();
	} );

	it( 'accepts numeric, `fill` and `full` choices in declared order', () => {
		const choices: DashboardWidthOption[] = [
			{ value: 1, label: 'Half width' },
			{ value: 'fill', label: 'Available width' },
			{ value: 'full', label: 'Full width' },
		];

		expect( resolveWidthOptions( choices, 'grid' ) ).toEqual( {
			kind: 'custom',
			options: choices,
		} );
		expect( warningMock ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'an empty list', [] ],
		[ 'a zero span', [ { value: 0, label: 'Zero' } ] ],
		[ 'a negative span', [ { value: -1, label: 'Negative' } ] ],
		[ 'a fractional span', [ { value: 1.5, label: 'Fractional' } ] ],
		[ 'a NaN span', [ { value: NaN, label: 'NaN' } ] ],
		[ 'an unknown named value', [ { value: 'auto', label: 'Auto' } ] ],
		[ 'an empty label', [ { value: 1, label: '' } ] ],
		[ 'a missing label', [ { value: 1 } ] ],
		[ 'a null entry', [ null ] ],
		[
			'duplicate values',
			[
				{ value: 1, label: 'Half width' },
				{ value: 1, label: 'Half width again' },
			],
		],
	] )( 'fails closed for %s', ( _description, options ) => {
		expect(
			resolveWidthOptions(
				options as Parameters< typeof resolveWidthOptions >[ 0 ],
				'grid'
			)
		).toEqual( { kind: 'invalid' } );
		expect( warningMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores the choices on the masonry model, which stores numeric widths only', () => {
		expect(
			resolveWidthOptions(
				[ { value: 1, label: 'Half width' } ],
				'masonry'
			)
		).toEqual( { kind: 'default' } );
		expect( warningMock ).toHaveBeenCalledWith(
			'WidgetDashboard: widthOptions applies to the grid model only; the masonry model stores numeric widths only, so the list is ignored there.'
		);
	} );
} );

describe( 'toItemResizeWidths', () => {
	it( 'keeps the default snapping without choices', () => {
		expect(
			toItemResizeWidths( { kind: 'default' }, [ 'a', 'b' ] )
		).toBeUndefined();
	} );

	it( 'projects the choices onto every item and strips `fill`', () => {
		expect(
			toItemResizeWidths(
				{
					kind: 'custom',
					options: [
						{ value: 1, label: 'Half width' },
						{ value: 'fill', label: 'Available width' },
						{ value: 'full', label: 'Full width' },
					],
				},
				[ 'a', 'b' ]
			)
		).toEqual( {
			a: [ 1, 'full' ],
			b: [ 1, 'full' ],
		} );
	} );

	it( 'freezes the width axis for a `fill`-only list', () => {
		expect(
			toItemResizeWidths(
				{
					kind: 'custom',
					options: [ { value: 'fill', label: 'Available width' } ],
				},
				[ 'a' ]
			)
		).toEqual( { a: [] } );
	} );

	it( 'still resizes for a `full`-only list', () => {
		expect(
			toItemResizeWidths(
				{
					kind: 'custom',
					options: [ { value: 'full', label: 'Full width' } ],
				},
				[ 'a' ]
			)
		).toEqual( { a: [ 'full' ] } );
	} );

	it( 'freezes the width axis for an invalid configuration', () => {
		expect( toItemResizeWidths( { kind: 'invalid' }, [ 'a' ] ) ).toEqual( {
			a: [],
		} );
	} );

	it( 'returns an empty map when there are no items', () => {
		expect(
			toItemResizeWidths(
				{
					kind: 'custom',
					options: [ { value: 1, label: 'Half width' } ],
				},
				[]
			)
		).toEqual( {} );
	} );
} );
