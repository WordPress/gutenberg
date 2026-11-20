import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
	renderBlockEditFeatures,
	setBlockEditFeatures,
} from '../../components/block-edit/features';
import {
	DEFAULT_BLOCK_EDIT_CONTEXT,
	mayDisplayControlsKey,
	mayDisplayPatternEditingControlsKey,
} from '../../components/block-edit/context';

describe( 'renderBlockEditFeatures', () => {
	afterEach( () => {
		setBlockEditFeatures( [] );
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
			setBlockEditFeatures( [
				{
					edit: () => <span>Feature control</span>,
					hasSupport: () => true,
					supportsPatternEditing,
				},
			] );
			const context = {
				...DEFAULT_BLOCK_EDIT_CONTEXT,
				name: 'test/container',
				isSelected,
				[ mayDisplayControlsKey ]: isSelected,
				[ mayDisplayPatternEditingControlsKey ]: true,
			};

			render(
				<>
					{ renderBlockEditFeatures(
						{ name: 'test/container', attributes: {} },
						context
					) }
				</>
			);

			expect( screen.queryByText( 'Feature control' ) !== null ).toBe(
				renders
			);
		}
	);

	it.each( [
		{ isSelected: false, fitText: true, renders: true },
		{ isSelected: false, fitText: undefined, renders: false },
		{ isSelected: true, fitText: undefined, renders: true },
	] )(
		'with isActive, selection=$isSelected and fitText=$fitText, renders=$renders',
		( { isSelected, fitText, renders } ) => {
			setBlockEditFeatures( [
				{
					edit: () => <span>Feature control</span>,
					hasSupport: () => true,
					attributeKeys: [ 'fitText' ],
					isActive: ( attributes ) => !! attributes.fitText,
				},
			] );
			const context = {
				...DEFAULT_BLOCK_EDIT_CONTEXT,
				name: 'test/heading',
				isSelected,
				[ mayDisplayControlsKey ]: isSelected,
			};

			render(
				<>
					{ renderBlockEditFeatures(
						{ name: 'test/heading', attributes: { fitText } },
						context
					) }
				</>
			);

			expect( screen.queryByText( 'Feature control' ) !== null ).toBe(
				renders
			);
		}
	);
} );
