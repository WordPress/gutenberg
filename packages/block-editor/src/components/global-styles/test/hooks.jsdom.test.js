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
