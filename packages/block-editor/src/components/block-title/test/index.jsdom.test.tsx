import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import BlockTitle from '../';

const blockTypeMap: Record< string, { title: string } | null > = {
	'name-not-exists': null,
	'name-exists': { title: 'Block Title' },
	'name-with-label': { title: 'Block With Label' },
	'name-with-custom-label': { title: 'Block With Custom Label' },
	'name-with-long-label': { title: 'Block With Long Label' },
	'reusable-block': { title: 'Reusable Block' },
};

const blockLabelMap: Record< string, string > = {
	'Block With Label': 'Test Label',
	'Block With Long Label':
		'This is a longer label than typical for blocks to have.',
	'Block With Custom Label': 'A Custom Label like a Block Variation Label',
	'Reusable Block': 'Reuse me!',
};

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const actualImplementation = await importOriginal();
	return {
		...actualImplementation,
		// The mocks only read the block type's title.
		isReusableBlock: ( ( { title }: { name: string; title?: string } ) => {
			return title === 'Reusable Block';
		} ) as typeof actualImplementation.isReusableBlock,
		__experimentalGetBlockLabel: ( ( { title }: { title: string } ) => {
			return blockLabelMap[ title ] || title;
		} ) as typeof actualImplementation.__experimentalGetBlockLabel,
	};
} );

// This allows us to tweak the returned value on each test.
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

describe( 'BlockTitle', () => {
	it( 'renders nothing if name is falsey', () => {
		( useSelect as Mock ).mockImplementation( () => null );

		const { container } = render( <BlockTitle /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing if block type does not exist', () => {
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
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
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-exists',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
				getActiveBlockVariation: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-exists" /> );

		expect( screen.getByText( 'Block Title' ) ).toBeVisible();
	} );

	it( 'renders label if it is set', () => {
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-label',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
				getBlockAttributes: () => null,
			} ) )
		);

		render( <BlockTitle clientId="id-name-with-label" /> );

		expect( screen.getByText( 'Test Label' ) ).toBeVisible();
	} );

	it( 'should prioritize reusable block title over title', () => {
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'reusable-block',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
				getBlockAttributes: () => ( { ref: 1 } ),
			} ) )
		);

		render( <BlockTitle clientId="id-reusable-block" /> );

		expect( screen.queryByText( 'Test Label' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Reuse me!' ) ).toBeVisible();
	} );

	it( 'should prioritize block label over title', () => {
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-custom-label',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
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
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-exists',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
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
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-long-label',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
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
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getBlockName: () => 'name-with-long-label',
				getBlockType: ( name: string ) => blockTypeMap[ name ],
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
