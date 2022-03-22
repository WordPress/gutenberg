/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTitle from '../';

jest.mock( '@wordpress/blocks', () => {
	return {
		getBlockType( name ) {
			switch ( name ) {
				case 'name-not-exists':
					return null;

				case 'name-exists':
					return { title: 'Block Title' };

				case 'name-with-label':
					return { title: 'Block With Label' };

				case 'name-with-custom-label':
					return { title: 'Block With Custom Label' };

				case 'name-with-long-label':
					return { title: 'Block With Long Label' };
			}
		},
		__experimentalGetBlockLabel( { title } ) {
			switch ( title ) {
				case 'Block With Label':
					return 'Test Label';

				case 'Block With Long Label':
					return 'This is a longer label than typical for blocks to have.';

				case 'Block With Custom Label':
					return 'A Custom Label like a Block Variation Label';

				default:
					return title;
			}
		},
	};
} );

jest.mock( '../../use-block-display-information', () => {
	const resultsMap = {
		'id-name-exists': { title: 'Block Title' },
		'id-name-with-label': { title: 'Block With Label' },
		'id-name-with-long-label': { title: 'Block With Long Label' },
	};
	return jest.fn( ( clientId ) => resultsMap[ clientId ] );
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'BlockTitle', () => {
	it( 'renders nothing if name is falsey', () => {
		useSelect.mockImplementation( () => ( {
			name: null,
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'renders nothing if block type does not exist', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-not-exists',
			attributes: null,
		} ) );
		const wrapper = shallow(
			<BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
		);

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'renders title if block type exists', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-exists',
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle clientId="id-name-exists" /> );

		expect( wrapper.text() ).toBe( 'Block Title' );
	} );

	it( 'renders label if it is set', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-with-label',
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle clientId="id-name-with-label" /> );

		expect( wrapper.text() ).toBe( 'Test Label' );
	} );

	it( 'should prioritize reusable block title over title', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-with-label',
			reusableBlockTitle: 'Reuse me!',
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle clientId="id-name-with-label" /> );

		expect( wrapper.text() ).toBe( 'Reuse me!' );
	} );

	it( 'should prioritize block label over title', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-with-custom-label',
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle clientId="id-name-with-label" /> );

		expect( wrapper.text() ).toBe(
			'A Custom Label like a Block Variation Label'
		);
	} );

	it( 'should default to block information title if no reusable title or block name is available', () => {
		useSelect.mockImplementation( () => ( {
			name: 'some-rando-name',
			attributes: null,
		} ) );

		const wrapper = shallow( <BlockTitle clientId="id-name-with-label" /> );

		expect( wrapper.text() ).toBe( 'Block With Label' );
	} );

	it( 'truncates the label with custom truncate length', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-with-long-label',
			attributes: null,
		} ) );

		const wrapper = shallow(
			<BlockTitle
				clientId="id-name-with-long-label"
				maximumLength={ 12 }
			/>
		);

		expect( wrapper.text() ).toBe( 'This is a...' );
	} );

	it( 'should not truncate the label if maximum length is undefined', () => {
		useSelect.mockImplementation( () => ( {
			name: 'name-with-long-label',
			attributes: null,
		} ) );

		const wrapper = shallow(
			<BlockTitle clientId="id-name-with-long-label" />
		);

		expect( wrapper.text() ).toBe(
			'This is a longer label than typical for blocks to have.'
		);
	} );
} );
