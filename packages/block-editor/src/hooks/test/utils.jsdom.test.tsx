import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { applyFilters, removeFilter } from '@wordpress/hooks';
import type { ComponentType } from 'react';
import { cleanEmptyObject, createBlockEditFilter } from '../utils';
import {
	BlockEditContextProvider,
	mayDisplayControlsKey,
	mayDisplayPatternEditingControlsKey,
} from '../../components/block-edit/context';

describe( 'cleanEmptyObject', () => {
	it( 'removes nested keys', () => {
		expect( cleanEmptyObject( { color: { text: undefined } } ) ).toEqual(
			undefined
		);
	} );

	it( 'removes partial nested keys', () => {
		expect(
			cleanEmptyObject( {
				color: { text: undefined },
				typography: { fontSize: '10px' },
			} )
		).toEqual( {
			typography: { fontSize: '10px' },
		} );
	} );

	it( 'preserves falsy nested keys', () => {
		expect( cleanEmptyObject( { color: { text: false } } ) ).not.toEqual(
			undefined
		);
		expect( cleanEmptyObject( { color: { text: '' } } ) ).not.toEqual(
			undefined
		);
	} );
} );

describe( 'createBlockEditFilter', () => {
	afterEach( () => {
		removeFilter( 'editor.BlockEdit', 'core/editor/hooks' );
	} );

	it.each( [
		{ supportsPatternEditing: true, isSelected: false, renders: true },
		{ supportsPatternEditing: true, isSelected: true, renders: true },
		{
			supportsPatternEditing: undefined,
			isSelected: false,
			renders: false,
		},
		{ supportsPatternEditing: undefined, isSelected: true, renders: true },
		{ supportsPatternEditing: false, isSelected: false, renders: false },
		{ supportsPatternEditing: false, isSelected: true, renders: false },
	] )(
		'with supportsPatternEditing=$supportsPatternEditing and selection=$isSelected, renders=$renders during pattern editing',
		( { supportsPatternEditing, isSelected, renders } ) => {
			createBlockEditFilter( [
				{
					edit: () => <span>Feature control</span>,
					hasSupport: () => true,
					supportsPatternEditing,
				},
			] );
			const FilteredEdit = applyFilters(
				'editor.BlockEdit',
				() => null
			) as ComponentType< { name: string; attributes: object } >;
			const context = {
				name: 'test/container',
				isSelected,
				[ mayDisplayControlsKey ]: isSelected,
				[ mayDisplayPatternEditingControlsKey ]: true,
			};

			render(
				<BlockEditContextProvider value={ context }>
					<FilteredEdit name="test/container" attributes={ {} } />
				</BlockEditContextProvider>
			);

			expect( screen.queryByText( 'Feature control' ) !== null ).toBe(
				renders
			);
		}
	);
} );
