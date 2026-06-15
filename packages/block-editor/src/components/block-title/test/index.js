/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTitle from '../';

const blockTypeMap = {
	'name-not-exists': null,
	'name-exists': { title: 'Block Title' },
	'name-with-label': { title: 'Block With Label' },
	'name-with-custom-label': { title: 'Block With Custom Label' },
	'name-with-long-label': { title: 'Block With Long Label' },
	'reusable-block': { title: 'Reusable Block' },
};

const blockLabelMap = {
	'Block With Label': 'Test Label',
	'Block With Long Label':
		'This is a longer label than typical for blocks to have.',
	'Block With Custom Label': 'A Custom Label like a Block Variation Label',
	'Reusable Block': 'Reuse me!',
};

jest.mock( '@wordpress/blocks', () => {
	const actualImplementation = jest.requireActual( '@wordpress/blocks' );
	return {
		...actualImplementation,
		isReusableBlock( { title } ) {
			return title === 'Reusable Block';
		},
		__experimentalGetBlockLabel( { title } ) {
			return blockLabelMap[ title ] || title;
		},
	};
} );

// This allows us to tweak the returned value on each test.
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

describe( 'BlockTitle', () => {
	it( 'renders nothing if name is falsey', () => {
		useSelect.mockImplementation( () => null );

		const { container } = render( <BlockTitle /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing if block type does not exist', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-not-exists',
				getBlockType: () => null,
			} ) )
		);

		const { container } = render(
			<BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders title if block type exists', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-exists',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
				getActiveBlockVariation: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-exists" /> );

		expect( screen.getByText( 'Block Title' ) ).toBeVisible();
	} );

	it( 'renders label if it is set', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-label',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-with-label" /> );

		expect( screen.getByText( 'Test Label' ) ).toBeVisible();
	} );

	it( 'should prioritize reusable block title over title', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'reusable-block',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => ( { ref: 1 } ),
			} ) )
		);

		render( <BlockTitle clientId="id-reusable-block" /> );

		expect( screen.queryByText( 'Test Label' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Reuse me!' ) ).toBeVisible();
	} );

	it( 'should prioritize block label over title', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-custom-label',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-with-label" /> );

		expect( screen.queryByText( 'Test Label' ) ).not.toBeInTheDocument();
		expect(
			screen.getByText( 'A Custom Label like a Block Variation Label' )
		).toBeVisible();
	} );

	it( 'should default to block variation title if no reusable title or block name is available', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-exists',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
				getActiveBlockVariation: () => ( {
					title: 'Block Variation Label',
				} ),
			} ) )
		);

		render( <BlockTitle clientId="id-name-exists" /> );

		expect( screen.getByText( 'Block Variation Label' ) ).toBeVisible();
	} );

	it( 'truncates the label with custom truncate length', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-long-label',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
			} ) )
		);

		render(
			<BlockTitle
				clientId="id-name-with-long-label"
				maximumLength={ 12 }
			/>
		);

		expect( screen.getByText( 'This is a...' ) ).toBeVisible();
	} );

	it( 'should not truncate the label if maximum length is undefined', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-long-label',
				getBlockType: ( name ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-with-long-label" /> );

		expect(
			screen.getByText(
				'This is a longer label than typical for blocks to have.'
			)
		).toBeVisible();
	} );
} );
