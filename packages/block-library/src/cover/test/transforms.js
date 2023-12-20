/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { metadata as coverMetadata, settings as coverSettings } from '../index';
import {
	metadata as groupMetadata,
	settings as groupSettings,
} from '../../group';

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( coverMetadata, coverSettings );
		registerBlockType( groupMetadata, groupSettings );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'transform from Group to Cover', () => {
		it( 'should return child Cover block when Group block contains only a single Cover block', () => {
			const block = createBlock(
				'core/group',
				{ gradient: 'my-gradient' },
				[ createBlock( 'core/cover', { dimRatio: 10 } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/cover' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { dimRatio: 10 },
				innerBlocks: [],
				name: 'core/cover',
			} );
		} );

		it( 'should wrap Group in a Cover block and move named gradient up to the parent Cover block', () => {
			const block = createBlock( 'core/group', {
				gradient: 'my-gradient',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/cover' );
			const innerGroupBlock = transformedBlocks[ 0 ].innerBlocks[ 0 ];

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { gradient: 'my-gradient' },
				name: 'core/cover',
			} );

			expect( innerGroupBlock.name ).toBe( 'core/group' );
			expect( innerGroupBlock.attributes ).not.toHaveProperty(
				'gradient'
			);
		} );

		it( 'should wrap Group in a Cover block and move custom gradient up to the parent Cover block', () => {
			const gradient =
				'linear-gradient(90deg,rgb(188,138,51) 0%,rgb(65,88,208) 100%)';
			const block = createBlock( 'core/group', {
				style: {
					color: {
						gradient,
					},
				},
			} );

			const transformedBlocks = switchToBlockType( block, 'core/cover' );
			const innerGroupBlock = transformedBlocks[ 0 ].innerBlocks[ 0 ];

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { customGradient: gradient },
				name: 'core/cover',
			} );

			expect( innerGroupBlock.name ).toBe( 'core/group' );
			expect( innerGroupBlock.attributes ).not.toHaveProperty( 'style' );
		} );

		it( 'should wrap Group in a Cover block and move named background color up to the parent Cover block', () => {
			const block = createBlock( 'core/group', {
				backgroundColor: 'my-background-color',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/cover' );
			const innerGroupBlock = transformedBlocks[ 0 ].innerBlocks[ 0 ];

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { overlayColor: 'my-background-color' },
				name: 'core/cover',
			} );

			expect( innerGroupBlock.name ).toBe( 'core/group' );
			expect( innerGroupBlock.attributes ).not.toHaveProperty(
				'backgroundColor'
			);
		} );

		it( 'should wrap Group in a Cover block and move custom background color up to the parent Cover block', () => {
			const background = '#ff0000';
			const block = createBlock( 'core/group', {
				style: {
					color: {
						background,
					},
				},
			} );

			const transformedBlocks = switchToBlockType( block, 'core/cover' );
			const innerGroupBlock = transformedBlocks[ 0 ].innerBlocks[ 0 ];

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { customOverlayColor: background },
				name: 'core/cover',
			} );

			expect( innerGroupBlock.name ).toBe( 'core/group' );
			expect( innerGroupBlock.attributes ).not.toHaveProperty( 'style' );
		} );
	} );

	describe( 'transform from Cover to Group', () => {
		it( 'should transfer named gradient color to Group block', () => {
			const block = createBlock( 'core/cover', {
				gradient: 'my-gradient',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { gradient: 'my-gradient' },
				name: 'core/group',
			} );
		} );

		it( 'should transfer custom gradient color to style object in Group block', () => {
			const gradient =
				'linear-gradient(90deg,rgb(188,138,51) 0%,rgb(65,88,208) 100%)';
			const block = createBlock( 'core/cover', {
				customGradient: gradient,
			} );

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { style: { color: { gradient } } },
				name: 'core/group',
			} );
		} );

		it( 'should transfer named background color to backgroundColor attribute in Group block', () => {
			const block = createBlock( 'core/cover', {
				overlayColor: 'my-background-color',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { backgroundColor: 'my-background-color' },
				name: 'core/group',
			} );
		} );

		it( 'should transfer custom background color to style object in Group block', () => {
			const block = createBlock( 'core/cover', {
				customOverlayColor: '#ff0000',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { style: { color: { background: '#ff0000' } } },
				name: 'core/group',
			} );
		} );

		it( 'should merge Cover block named gradient color into child Group block', () => {
			const block = createBlock(
				'core/cover',
				{
					gradient: 'my-gradient',
				},
				[ createBlock( 'core/group', { fontSize: 'medium' } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: { fontSize: 'medium', gradient: 'my-gradient' },
				innerBlocks: [],
				name: 'core/group',
			} );
		} );

		it( 'should merge Cover block custom gradient color to style object in child Group block', () => {
			const gradient =
				'linear-gradient(90deg,rgb(188,138,51) 0%,rgb(65,88,208) 100%)';
			const block = createBlock(
				'core/cover',
				{
					customGradient: gradient,
				},
				[ createBlock( 'core/group', { fontSize: 'medium' } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: {
					fontSize: 'medium',
					style: { color: { gradient } },
				},
				innerBlocks: [],
				name: 'core/group',
			} );
		} );

		it( 'should merge Cover block named background color to backgroundColor attribute in child Group block', () => {
			const block = createBlock(
				'core/cover',
				{
					overlayColor: 'my-background-color',
				},
				[ createBlock( 'core/group', { fontSize: 'medium' } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: {
					backgroundColor: 'my-background-color',
					fontSize: 'medium',
				},
				innerBlocks: [],
				name: 'core/group',
			} );
		} );

		it( 'should merge Cover block custom background color into child Group block', () => {
			const block = createBlock(
				'core/cover',
				{
					customOverlayColor: '#ff0000',
				},
				[ createBlock( 'core/group', { fontSize: 'medium' } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: {
					fontSize: 'medium',
					style: { color: { background: '#ff0000' } },
				},
				innerBlocks: [],
				name: 'core/group',
			} );
		} );

		it( 'should skip merging Cover block gradient into child Group block if Group block has background color', () => {
			const block = createBlock(
				'core/cover',
				{
					gradient: 'my-gradient',
				},
				[
					createBlock( 'core/group', {
						fontSize: 'medium',
						style: { color: { background: '#ff0000' } },
					} ),
				]
			);

			const transformedBlocks = switchToBlockType( block, 'core/group' );

			expect( transformedBlocks[ 0 ] ).toMatchObject( {
				attributes: {
					fontSize: 'medium',
					style: { color: { background: '#ff0000' } },
				},
				innerBlocks: [],
				name: 'core/group',
			} );
			expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
				'gradient'
			);
		} );
	} );
} );
