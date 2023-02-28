/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../../components/provider';
import BlockControls from '../../components/block-controls';
// eslint-disable-next-line no-unused-vars
import BlockEdit from '../../components/block-edit';
import {
	withDuotoneControls,
	getColorsFromDuotonePreset,
	getDuotonePresetFromColors,
} from '../duotone';

describe( 'withDuotoneControls', () => {
	const blockName = 'core/test-block';

	const blockSettings = {
		save: () => {},
		category: 'media',
		title: 'Block Title',
		edit: ( { children } ) => <>{ children }</>,
		supports: {
			color: {
				__experimentalDuotone: 'img',
			},
		},
	};

	const componentProps = {
		name: blockName,
		attributes: {},
		isSelected: true,
	};

	const settings = {
		__experimentalFeatures: {
			color: {
				palette: {
					default: [
						{
							name: 'Pale pink',
							slug: 'pale-pink',
							color: '#f78da7',
						},
						{
							name: 'Vivid green cyan',
							slug: 'vivid-green-cyan',
							color: '#00d084',
						},
					],
				},
				defaultDuotone: true,
				duotone: {
					default: [
						{
							name: 'Black and white',
							slug: 'black-and-white',
							colors: [ '#000000', '#FFFFFF' ],
						},
						{
							name: 'Pale pink and green',
							slug: 'palepink-green',
							colors: [ '#f78da7', '#00d084' ],
						},
					],
				},
			},
		},
	};

	beforeEach( () => {
		registerBlockType( blockName, blockSettings );
	} );

	afterEach( () => {
		unregisterBlockType( blockName );
	} );

	it( 'should show Duotone control in toolbar', () => {
		const EnhancedComponent = withDuotoneControls( ( { wrapperProps } ) => (
			<div { ...wrapperProps } />
		) );

		render(
			<BlockEditorProvider settings={ settings } value={ [] }>
				<SlotFillProvider>
					<BlockEdit { ...componentProps }>
						<EnhancedComponent />
					</BlockEdit>
					<BlockControls.Slot group="block" />
				</SlotFillProvider>
			</BlockEditorProvider>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'Apply duotone filter',
			} )
		).toBeInTheDocument();
	} );
} );

describe( 'Duotone utilities', () => {
	const duotonePalette = [
		{
			name: 'Dark grayscale',
			colors: [ '#000000', '#7f7f7f' ],
			slug: 'dark-grayscale',
		},
		{
			name: 'Grayscale',
			colors: [ '#000000', '#ffffff' ],
			slug: 'grayscale',
		},
		{
			name: 'Purple and yellow',
			colors: [ '#8c00b7', '#fcff41' ],
			slug: 'purple-yellow',
		},
	];
	describe( 'getColorsFromDuotonePreset', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getColorsFromDuotonePreset() ).toBeUndefined();
		} );

		it( 'should return undefined if no duotone preset is provided', () => {
			expect(
				getColorsFromDuotonePreset( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if a non-existent preset is provided', () => {
			expect(
				getColorsFromDuotonePreset( 'does-not-exist', duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return the colors from the preset if found', () => {
			expect(
				getColorsFromDuotonePreset(
					duotonePalette[ 2 ].slug,
					duotonePalette
				)
			).toEqual( duotonePalette[ 2 ].colors );
		} );
	} );

	describe( 'getDuotonePresetFromColors', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getDuotonePresetFromColors() ).toBeUndefined();
		} );

		it( 'should return undefined if no colors are provided', () => {
			expect(
				getDuotonePresetFromColors( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if provided colors is not of valid type', () => {
			const notAnArrayOfColorStrings = 'purple-yellow';
			expect(
				getDuotonePresetFromColors(
					notAnArrayOfColorStrings,
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return undefined if no duotone palette is provided', () => {
			expect(
				getDuotonePresetFromColors( [ '#8c00b7', '#fcff41' ] )
			).toBeUndefined();
		} );

		it( 'should return undefined if the provided colors do not match any preset', () => {
			expect(
				getDuotonePresetFromColors(
					[ '#000000', '#000000' ],
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return the slug of the preset if found', () => {
			expect(
				getDuotonePresetFromColors(
					duotonePalette[ 2 ].colors,
					duotonePalette
				)
			).toEqual( duotonePalette[ 2 ].slug );
		} );
	} );
} );
