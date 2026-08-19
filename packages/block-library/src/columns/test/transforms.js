import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import {
	metadata as columnsMetadata,
	settings as columnsSettings,
} from '../index';
import {
	metadata as columnMetadata,
	settings as columnSettings,
} from '../../column';
import {
	metadata as groupMetadata,
	settings as groupSettings,
} from '../../group';

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( columnsMetadata, columnsSettings );
		registerBlockType( columnMetadata, columnSettings );
		registerBlockType( groupMetadata, groupSettings );
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			attributes: {
				content: {
					type: 'string',
				},
			},
			save: () => {},
			category: 'text',
			title: 'Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'transforms Columns to the Grid variation of Group', () => {
		const block = createBlock(
			'core/columns',
			{
				align: 'wide',
				isStackedOnMobile: false,
				verticalAlignment: 'center',
			},
			[
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'One' } ),
				] ),
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'Two' } ),
					createBlock( 'core/paragraph', { content: 'Three' } ),
				] ),
			]
		);

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-grid'
		);

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/group',
			attributes: {
				align: 'wide',
				layout: { type: 'grid', columnCount: 2 },
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'isStackedOnMobile'
		);
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'verticalAlignment'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 2 );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
			name: 'core/paragraph',
			attributes: { content: 'One' },
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ] ).toMatchObject( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Two' },
				} ),
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Three' },
				} ),
			],
		} );
	} );

	it( 'transforms Columns to the Row variation of Group with one child for each column', () => {
		const block = createBlock(
			'core/columns',
			{
				align: 'wide',
				isStackedOnMobile: true,
				verticalAlignment: 'center',
			},
			[
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'One' } ),
				] ),
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'Two' } ),
					createBlock( 'core/paragraph', { content: 'Three' } ),
				] ),
				createBlock( 'core/column' ),
			]
		);

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-row'
		);

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/group',
			attributes: {
				align: 'wide',
				layout: {
					type: 'flex',
					flexWrap: 'nowrap',
					verticalAlignment: 'center',
				},
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'isStackedOnMobile'
		);
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'verticalAlignment'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 3 );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
			name: 'core/paragraph',
			attributes: { content: 'One' },
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ] ).toMatchObject( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Two' },
				} ),
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Three' },
				} ),
			],
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 2 ] ).toMatchObject( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [],
		} );
	} );

	it( 'migrates Column widths to Row child sizing controls', () => {
		const block = createBlock( 'core/columns', {}, [
			createBlock( 'core/column', { width: '320px' }, [
				createBlock( 'core/paragraph', {
					content: 'One',
					style: {
						color: { text: '#123456' },
						layout: { columnSpan: 2 },
					},
				} ),
			] ),
			createBlock( 'core/column', { width: '50%' }, [
				createBlock( 'core/paragraph', { content: 'Two' } ),
			] ),
			createBlock( 'core/column', {}, [
				createBlock( 'core/paragraph', { content: 'Three' } ),
			] ),
		] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-row'
		);

		expect(
			transformedBlocks[ 0 ].innerBlocks.map(
				( innerBlock ) => innerBlock.attributes.style.layout
			)
		).toEqual( [
			{
				columnSpan: 2,
				selfStretch: 'fixed',
				flexSize: '320px',
			},
			{ selfStretch: 'fixed', flexSize: '50%' },
			{ selfStretch: 'fill' },
		] );
		expect(
			transformedBlocks[ 0 ].innerBlocks[ 0 ].attributes.style.color
		).toEqual( { text: '#123456' } );
	} );

	it( 'sets equal fixed widths when no Column widths are set', () => {
		const block = createBlock( 'core/columns', {}, [
			createBlock( 'core/column', {}, [
				createBlock( 'core/paragraph', { content: 'One' } ),
			] ),
			createBlock( 'core/column', {}, [
				createBlock( 'core/paragraph', { content: 'Two' } ),
			] ),
			createBlock( 'core/column', {}, [
				createBlock( 'core/paragraph', { content: 'Three' } ),
			] ),
		] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-row'
		);

		expect(
			transformedBlocks[ 0 ].innerBlocks.map(
				( innerBlock ) => innerBlock.attributes.style.layout
			)
		).toEqual( [
			{ selfStretch: 'fixed', flexSize: '33.33%' },
			{ selfStretch: 'fixed', flexSize: '33.33%' },
			{ selfStretch: 'fixed', flexSize: '33.33%' },
		] );
	} );

	it( 'transforms the Row variation of Group to Columns with one Column per Row child', () => {
		const block = createBlock(
			'core/group',
			{
				align: 'wide',
				layout: {
					type: 'flex',
					flexWrap: 'nowrap',
					verticalAlignment: 'center',
				},
			},
			[
				createBlock( 'core/paragraph', { content: 'One' } ),
				createBlock(
					'core/group',
					{ layout: { type: 'constrained' } },
					[
						createBlock( 'core/paragraph', { content: 'Two' } ),
						createBlock( 'core/paragraph', { content: 'Three' } ),
					]
				),
			]
		);

		const transformedBlocks = switchToBlockType( block, 'core/columns' );

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/columns',
			attributes: {
				align: 'wide',
				verticalAlignment: 'center',
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'layout'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 2 );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
			name: 'core/column',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'One' },
				},
			],
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ] ).toMatchObject( {
			name: 'core/column',
			innerBlocks: [
				{
					name: 'core/group',
					attributes: { layout: { type: 'constrained' } },
					innerBlocks: [
						{ attributes: { content: 'Two' } },
						{ attributes: { content: 'Three' } },
					],
				},
			],
		} );
	} );

	it( 'migrates fixed Row child sizes to Column widths', () => {
		const block = createBlock(
			'core/group',
			{ layout: { type: 'flex', flexWrap: 'nowrap' } },
			[
				createBlock( 'core/paragraph', {
					content: 'One',
					style: {
						color: { text: '#123456' },
						layout: {
							columnSpan: 2,
							selfStretch: 'fixed',
							flexSize: '320px',
						},
					},
				} ),
				createBlock( 'core/paragraph', {
					content: 'Two',
					style: {
						layout: {
							selfStretch: 'fixedNoShrink',
							flexSize: '50%',
						},
					},
				} ),
				createBlock( 'core/paragraph', {
					content: 'Three',
					style: {
						layout: {
							selfStretch: 'fill',
							flexSize: '25%',
						},
					},
				} ),
			]
		);

		const transformedBlocks = switchToBlockType( block, 'core/columns' );

		expect(
			transformedBlocks[ 0 ].innerBlocks.map(
				( column ) => column.attributes.width
			)
		).toEqual( [ '320px', '50%', undefined ] );
		expect(
			transformedBlocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 0 ].attributes
				.style
		).toEqual( {
			color: { text: '#123456' },
			layout: { columnSpan: 2 },
		} );
		expect(
			transformedBlocks[ 0 ].innerBlocks[ 1 ].innerBlocks[ 0 ].attributes
		).not.toHaveProperty( 'style' );
		expect(
			transformedBlocks[ 0 ].innerBlocks[ 2 ].innerBlocks[ 0 ].attributes
		).not.toHaveProperty( 'style' );
	} );

	it( 'transforms Grid variation of Group to Columns using the explicit grid column count', () => {
		const block = createBlock(
			'core/group',
			{
				align: 'wide',
				layout: { type: 'grid', columnCount: 3 },
			},
			[
				createBlock( 'core/paragraph', { content: 'One' } ),
				createBlock( 'core/paragraph', { content: 'Two' } ),
			]
		);

		const transformedBlocks = switchToBlockType( block, 'core/columns' );

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/columns',
			attributes: {
				align: 'wide',
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'layout'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 3 );
		expect( transformedBlocks[ 0 ].innerBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/column',
				attributes: { width: '33.33%' },
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/paragraph',
						attributes: { content: 'One' },
					} ),
				],
			} ),
			expect.objectContaining( {
				name: 'core/column',
				attributes: { width: '33.33%' },
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/paragraph',
						attributes: { content: 'Two' },
					} ),
				],
			} ),
			expect.objectContaining( {
				name: 'core/column',
				attributes: { width: '33.33%' },
				innerBlocks: [],
			} ),
		] );
	} );
} );
