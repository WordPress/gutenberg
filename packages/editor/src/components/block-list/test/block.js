/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockListBlock } from '../block';
import BlockInvalidWarning from '../block-invalid-warning';
import BlockEdit from '../../block-edit';
import BlockHtml from '../block-html';

describe( 'BlockListBlock', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			category: 'common',
			title: 'Test',
			attributes: {},
			edit: () => {},
			save: () => {},
		} );
	} );

	describe( 'Invalid Block', () => {
		it( 'valid block is shown without warning and with visual editor in visual mode', () => {
			const block = createBlock( 'core/test-block' );
			const wrapper = shallow( <BlockListBlock block={ block } mode="visual" /> );

			expect( wrapper.hasClass( 'has-warning' ) ).toBe( false );
			expect( wrapper.find( BlockInvalidWarning ).exists() ).toBe( false );
			expect( wrapper.find( BlockEdit ).exists() ).toBe( true );
		} );

		it( 'valid block is shown without warning and with html editor in html mode', () => {
			const block = createBlock( 'core/test-block' );
			const wrapper = shallow( <BlockListBlock block={ block } mode="html" /> );

			expect( wrapper.hasClass( 'has-warning' ) ).toBe( false );
			expect( wrapper.find( BlockInvalidWarning ).exists() ).toBe( false );
			expect( wrapper.find( BlockHtml ).exists() ).toBe( true );
		} );

		it( 'invalid block is shown with warning and without visual editor when in visual mode', () => {
			const block = { ... createBlock( 'core/test-block' ), isValid: false };
			const wrapper = shallow( <BlockListBlock block={ block } mode="visual" /> );

			expect( wrapper.hasClass( 'has-warning' ) ).toBe( true );
			expect( wrapper.find( BlockInvalidWarning ).exists() ).toBe( true );
			expect( wrapper.find( BlockEdit ).exists() ).toBe( false );
		} );

		it( 'invalid block is shown without warning and with html editor when in html mode', () => {
			const block = { ... createBlock( 'core/test-block' ), isValid: false };
			const wrapper = shallow( <BlockListBlock block={ block } mode="html" /> );

			expect( wrapper.hasClass( 'has-warning' ) ).toBe( false );
			expect( wrapper.find( BlockInvalidWarning ).exists() ).toBe( false );
			expect( wrapper.find( BlockHtml ).exists() ).toBe( true );
		} );
	} );
} );
