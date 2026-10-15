import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { useSettingsForBlockElement } from '../hooks';

describe( 'useSettingsForBlockElement background clip', () => {
	const WITH_CLIP = 'test/with-clip';
	const WITHOUT_CLIP = 'test/without-clip';

	beforeAll( () => {
		registerBlockType( WITH_CLIP, {
			apiVersion: 3,
			title: 'With clip',
			category: 'text',
			supports: { background: { gradient: true, backgroundClip: true } },
		} );
		registerBlockType( WITHOUT_CLIP, {
			apiVersion: 3,
			title: 'Without clip',
			category: 'text',
			supports: { background: { gradient: true } },
		} );
	} );

	afterAll( () => {
		unregisterBlockType( WITH_CLIP );
		unregisterBlockType( WITHOUT_CLIP );
	} );

	const getClipSetting = ( settings, blockName ) =>
		renderHook( () => useSettingsForBlockElement( settings, blockName ) )
			.result.current.background?.backgroundClip;

	it( 'allows the text value when the block supports it and the theme is silent', () => {
		expect( getClipSetting( {}, WITH_CLIP ) ).toEqual( [ 'text' ] );
	} );

	it( 'keeps the theme setting when there is one', () => {
		expect(
			getClipSetting(
				{ background: { backgroundClip: false } },
				WITH_CLIP
			)
		).toBe( false );
	} );

	it( 'disables the setting when the block does not support it', () => {
		expect(
			getClipSetting(
				{ background: { backgroundClip: true } },
				WITHOUT_CLIP
			)
		).toBe( false );
	} );

	it( 'leaves the root setting off', () => {
		expect( getClipSetting( {} ) ).toBe( false );
	} );
} );

describe( 'useSettingsForBlockElement margin sides', () => {
	const WITH_UNCONSTRAINED = 'test/with-unconstrained-margin';
	const WITHOUT_MARGIN = 'test/without-margin';
	const SIDES = [ 'top', 'bottom' ];
	const UNCONSTRAINED_SIDES = [ 'top', 'right', 'bottom', 'left' ];

	beforeAll( () => {
		registerBlockType( WITH_UNCONSTRAINED, {
			apiVersion: 3,
			title: 'With unconstrained margin',
			category: 'text',
			supports: {
				spacing: {
					margin: {
						sides: SIDES,
						unconstrainedSides: UNCONSTRAINED_SIDES,
					},
				},
			},
		} );
		registerBlockType( WITHOUT_MARGIN, {
			apiVersion: 3,
			title: 'Without margin',
			category: 'text',
			supports: { spacing: { padding: true } },
		} );
	} );

	afterAll( () => {
		unregisterBlockType( WITH_UNCONSTRAINED );
		unregisterBlockType( WITHOUT_MARGIN );
	} );

	const getMargin = ( parentLayout, blockName = WITH_UNCONSTRAINED ) =>
		renderHook( () =>
			useSettingsForBlockElement(
				{ spacing: { margin: true, padding: true }, parentLayout },
				blockName
			)
		).result.current.spacing.margin;

	it( 'offers the unconstrained sides when the parent layout is flex', () => {
		expect( getMargin( { type: 'flex' } ).sides ).toEqual(
			UNCONSTRAINED_SIDES
		);
	} );

	it( 'offers the unconstrained sides when the parent layout defaults to flow', () => {
		expect( getMargin( { default: { type: 'default' } } ).sides ).toEqual(
			UNCONSTRAINED_SIDES
		);
	} );

	it( 'keeps the default sides when the parent layout is constrained', () => {
		expect( getMargin( { type: 'constrained' } ).sides ).toEqual( SIDES );
	} );

	it( 'keeps the default sides when the parent layout comes from a constrained default', () => {
		expect(
			getMargin( { default: { type: 'constrained' } } ).sides
		).toEqual( SIDES );
	} );

	it( 'keeps the default sides when there is no parent layout', () => {
		expect( getMargin( undefined ).sides ).toEqual( SIDES );
	} );

	it( 'does not add sides when the block does not support margin', () => {
		expect( getMargin( { type: 'flex' }, WITHOUT_MARGIN ) ).toBe( false );
	} );
} );
