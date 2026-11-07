import { describe, expect, it } from 'vitest';
import { applyBuiltInValidationFixes } from '../apply-built-in-validation-fixes';
import type { Block, BlockType } from '../../../types';

describe( 'applyBuiltInValidationFixes', () => {
	const blockType = {
		name: 'core/test-block',
		attributes: {},
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
		icon: { src: 'block-default' },
	} as BlockType;

	it( 'should return the same block when no fix changes an attribute', () => {
		const block = {
			clientId: 'test',
			name: 'core/test-block',
			isValid: false,
			attributes: { className: undefined },
			innerBlocks: [],
			originalContent: '<div class="default"></div>',
		} as Block;

		expect( applyBuiltInValidationFixes( block, blockType ) ).toBe( block );
	} );

	it( 'should return a new block when a fix changes an attribute', () => {
		const block = {
			clientId: 'test',
			name: 'core/test-block',
			isValid: false,
			attributes: { className: undefined },
			innerBlocks: [],
			originalContent: '<div class="default custom"></div>',
		} as Block;

		expect( applyBuiltInValidationFixes( block, blockType ) ).toEqual( {
			...block,
			attributes: { className: 'custom' },
		} );
	} );
} );
