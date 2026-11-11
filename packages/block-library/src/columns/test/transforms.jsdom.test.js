import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from 'vitest';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select } from '@wordpress/data';
import {
	createBlock,
	getBlockTypes,
	getPossibleBlockTransformations,
	setGroupingBlockName,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import groupTransforms from '../../group/transforms';
import columnsTransforms from '../transforms';
import detailsMetadata from '../../details/block.json';
import detailsTransforms from '../../details/transforms';
import quoteMetadata from '../../quote/block.json';
import quoteTransforms from '../../quote/transforms';
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
			attributes: { layout: { type: 'default' } },
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

	it( "preserves each Column block's styles when transforming Columns to Grid", () => {
		const block = createBlock( 'core/columns', {}, [
			createBlock(
				'core/column',
				{ style: { color: { background: '#123456' } } },
				[ createBlock( 'core/paragraph', { content: 'One' } ) ]
			),
			createBlock(
				'core/column',
				{ style: { spacing: { padding: { top: '10px' } } } },
				[
					createBlock( 'core/paragraph', { content: 'Two' } ),
					createBlock( 'core/paragraph', { content: 'Three' } ),
				]
			),
		] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-grid'
		);

		expect(
			transformedBlocks[ 0 ].innerBlocks.map( ( innerBlock ) => ( {
				name: innerBlock.name,
				style: innerBlock.attributes.style,
			} ) )
		).toEqual( [
			{
				name: 'core/group',
				style: { color: { background: '#123456' } },
			},
			{
				name: 'core/group',
				style: { spacing: { padding: { top: '10px' } } },
			},
		] );
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
			attributes: { layout: { type: 'default' } },
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
			attributes: { layout: { type: 'default' } },
			innerBlocks: [],
		} );
	} );

	it( "preserves each Column block's styles when transforming Columns to Row", () => {
		const block = createBlock( 'core/columns', {}, [
			createBlock(
				'core/column',
				{
					width: '320px',
					style: {
						color: { background: '#123456' },
						layout: { columnSpan: 2 },
					},
				},
				[ createBlock( 'core/paragraph', { content: 'One' } ) ]
			),
			createBlock(
				'core/column',
				{
					width: '50%',
					style: { spacing: { padding: { top: '10px' } } },
				},
				[
					createBlock( 'core/paragraph', { content: 'Two' } ),
					createBlock( 'core/paragraph', { content: 'Three' } ),
				]
			),
		] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-row'
		);

		expect(
			transformedBlocks[ 0 ].innerBlocks.map( ( innerBlock ) => ( {
				name: innerBlock.name,
				style: innerBlock.attributes.style,
			} ) )
		).toEqual( [
			{
				name: 'core/group',
				style: {
					color: { background: '#123456' },
					layout: {
						columnSpan: 2,
						selfStretch: 'fixed',
						flexSize: '320px',
					},
				},
			},
			{
				name: 'core/group',
				style: {
					spacing: { padding: { top: '10px' } },
					layout: {
						selfStretch: 'fixed',
						flexSize: '50%',
					},
				},
			},
		] );
	} );

	it.each( [
		[ 'Grid', 'group-grid' ],
		[ 'Row', 'group-row' ],
	] )(
		"preserves each Column block's layout attributes when transforming Columns to %s",
		( _variationTitle, variationName ) => {
			const columnLayouts = [
				{
					type: 'constrained',
					contentSize: '640px',
					wideSize: '1200px',
				},
				{
					type: 'flex',
					orientation: 'vertical',
					justifyContent: 'center',
				},
			];
			const block = createBlock(
				'core/columns',
				{},
				columnLayouts.map( ( layout ) =>
					createBlock( 'core/column', { layout }, [
						createBlock( 'core/paragraph' ),
					] )
				)
			);

			const transformedBlocks = switchToBlockType(
				block,
				'core/group',
				variationName
			);

			expect(
				transformedBlocks[ 0 ].innerBlocks.map( ( innerBlock ) => ( {
					name: innerBlock.name,
					layout: innerBlock.attributes.layout,
				} ) )
			).toEqual(
				columnLayouts.map( ( layout ) => ( {
					name: 'core/group',
					layout,
				} ) )
			);
		}
	);

	it.each( [
		[ 'Grid', 'group-grid' ],
		[ 'Row', 'group-row' ],
	] )(
		'transforms an implicitly flow-layout Column to a flow Group in %s',
		( _variationTitle, variationName ) => {
			const block = createBlock( 'core/columns', {}, [
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'One' } ),
					createBlock( 'core/paragraph', { content: 'Two' } ),
				] ),
			] );

			const transformedBlocks = switchToBlockType(
				block,
				'core/group',
				variationName
			);

			expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
				name: 'core/group',
				attributes: { layout: { type: 'default' } },
			} );
		}
	);

	it.each( [
		[ 'Grid', 'group-grid' ],
		[ 'Row', 'group-row' ],
	] )(
		'preserves root-level style attributes when transforming Columns to %s',
		( _variationTitle, variationName ) => {
			const rootStyleAttributes = {
				backgroundColor: 'primary',
				borderColor: 'accent',
				className: 'is-style-example custom-class',
				fontFamily: 'heading',
				fontSize: 'large',
				gradient: 'vivid-cyan-blue-to-vivid-purple',
				textColor: 'contrast',
			};
			const block = createBlock( 'core/columns', {}, [
				createBlock( 'core/column', rootStyleAttributes, [
					createBlock( 'core/paragraph' ),
				] ),
			] );

			const transformedBlocks = switchToBlockType(
				block,
				'core/group',
				variationName
			);

			expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
				name: 'core/group',
				attributes: rootStyleAttributes,
			} );
		}
	);

	it.each( [
		[ 'Grid', 'group-grid' ],
		[ 'Row', 'group-row' ],
	] )(
		'preserves Group-supported Column attributes when transforming Columns to %s',
		( _variationTitle, variationName ) => {
			const block = createBlock( 'core/columns', {}, [
				createBlock(
					'core/column',
					{
						anchor: 'column-anchor',
						lock: { move: true, remove: true },
						templateLock: 'insert',
						verticalAlignment: 'center',
						width: '320px',
					},
					[ createBlock( 'core/paragraph' ) ]
				),
			] );

			const transformedBlocks = switchToBlockType(
				block,
				'core/group',
				variationName
			);
			const transformedColumn = transformedBlocks[ 0 ].innerBlocks[ 0 ];

			expect( transformedColumn ).toMatchObject( {
				name: 'core/group',
				attributes: {
					anchor: 'column-anchor',
					lock: { move: true, remove: true },
					templateLock: 'insert',
				},
			} );
			expect( transformedColumn.attributes ).not.toHaveProperty(
				'verticalAlignment'
			);
			expect( transformedColumn.attributes ).not.toHaveProperty(
				'width'
			);
		}
	);

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

const wrappers = [
	[ 'core/group', 'core/group' ],
	[ 'core/columns', 'core/column' ],
	[ 'core/details', 'core/details' ],
];

const groupConstraints = [
	[ { parent: [ 'core/cover' ] }, false ],
	[ { parent: [ 'core/group' ] }, true ],
	[ { ancestor: [ 'core/cover' ] }, true ],
	[ { parent: [ 'core/group' ], ancestor: [ 'core/cover' ] }, true ],
];

function registerSource( settings = {} ) {
	registerBlockType( 'test/child', {
		apiVersion: 3,
		title: 'Child',
		category: 'text',
		attributes: { content: { type: 'string' } },
		save: () => null,
		...settings,
	} );
	return createBlock( 'test/child', { content: 'Preserved content' } );
}

describe( 'wrapping transforms', () => {
	beforeEach( () => {
		setGroupingBlockName( 'core/group' );
		for ( const [ metadata, transforms ] of [
			[ groupMetadata, groupTransforms ],
			[ columnsMetadata, columnsTransforms ],
			[ columnMetadata, undefined ],
			[ detailsMetadata, detailsTransforms ],
			[ quoteMetadata, quoteTransforms ],
		] ) {
			registerBlockType( metadata, {
				save: () => null,
				transforms,
			} );
		}
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			attributes: {},
			save: () => null,
		} );
	} );

	afterEach( () => {
		dispatch( blockEditorStore ).resetBlocks( [] );
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it.each( groupConstraints )(
		'validates Group actions for %j inside Cover',
		( settings, expected ) => {
			registerBlockType( 'core/cover', {
				apiVersion: 3,
				title: 'Cover',
				category: 'design',
				attributes: {},
				save: () => null,
			} );
			const child = registerSource( settings );
			const initialParent = settings.parent?.includes( 'core/group' )
				? createBlock( 'core/group', {}, [ child ] )
				: child;
			const cover = createBlock( 'core/cover', {}, [ initialParent ] );
			dispatch( blockEditorStore ).updateSettings( {
				allowedBlockTypes: true,
			} );
			dispatch( blockEditorStore ).resetBlocks( [ cover ] );
			dispatch( blockEditorStore ).updateBlockListSettings(
				cover.clientId,
				{}
			);
			if ( initialParent !== child ) {
				dispatch( blockEditorStore ).updateBlockListSettings(
					initialParent.clientId,
					{}
				);
			}
			const selectors = select( blockEditorStore );
			const rootClientId = selectors.getBlockRootClientId(
				child.clientId
			);
			expect(
				selectors.canInsertBlockType( 'test/child', rootClientId )
			).toBe( true );
			expect(
				selectors.canInsertBlockType( 'core/group', rootClientId )
			).toBe( true );
			expect( selectors.canRemoveBlocks( [ child.clientId ] ) ).toBe(
				true
			);
			expect( selectors.isGroupable( [ child.clientId ] ) ).toBe(
				expected
			);
			const paragraph = createBlock( 'core/paragraph' );
			dispatch( blockEditorStore ).insertBlocks(
				[ paragraph ],
				undefined,
				rootClientId
			);
			expect(
				selectors.isGroupable( [ child.clientId, paragraph.clientId ] )
			).toBe( expected );
			expect(
				selectors.isGroupable( [ child.clientId, 'missing-block' ] )
			).toBe( false );
		}
	);

	it( 'retains the required Cover ancestor after wrapping', () => {
		registerBlockType( 'core/cover', {
			apiVersion: 3,
			title: 'Cover',
			category: 'design',
			attributes: {},
			save: () => null,
		} );
		const child = registerSource( { ancestor: [ 'core/cover' ] } );
		const cover = createBlock( 'core/cover', {}, [ child ] );
		dispatch( blockEditorStore ).resetBlocks( [ cover ] );
		dispatch( blockEditorStore ).updateBlockListSettings(
			cover.clientId,
			{}
		);
		const converted = switchToBlockType( child, 'core/group' );
		dispatch( blockEditorStore ).replaceBlocks(
			[ child.clientId ],
			converted
		);
		const selectors = select( blockEditorStore );
		const wrappedChild = converted[ 0 ].innerBlocks[ 0 ];
		expect( selectors.getBlockParents( wrappedChild.clientId ) ).toContain(
			cover.clientId
		);
		expect(
			selectors.getBlockName(
				selectors.getBlockRootClientId( wrappedChild.clientId )
			)
		).toBe( 'core/group' );
	} );

	it.each( wrappers )(
		'does not offer %s when its immediate parent is disallowed',
		( destination ) => {
			const block = registerSource( { parent: [ 'core/cover' ] } );
			expect(
				getPossibleBlockTransformations( [ block ] ).map(
					( { name } ) => name
				)
			).not.toContain( destination );
		}
	);

	it.each( wrappers )(
		'does not convert to %s when its immediate parent is disallowed',
		( destination ) => {
			const block = registerSource( { parent: [ 'core/cover' ] } );
			expect( switchToBlockType( block, destination ) ).toBeNull();
		}
	);

	it.each( wrappers )(
		'preserves a child whose allowed parent matches %s',
		( destination, parent ) => {
			const block = registerSource( { parent: [ parent ] } );
			const converted = switchToBlockType( block, destination );
			const immediateParent =
				destination === 'core/columns'
					? converted[ 0 ].innerBlocks[ 0 ]
					: converted[ 0 ];
			expect( immediateParent.name ).toBe( parent );
			expect( immediateParent.innerBlocks[ 0 ] ).toMatchObject( {
				name: block.name,
				attributes: block.attributes,
			} );
		}
	);

	it.each( wrappers )(
		'allows ancestor-only restrictions when wrapping in %s',
		( destination ) => {
			const block = registerSource( { ancestor: [ 'core/cover' ] } );
			expect( switchToBlockType( block, destination ) ).not.toBeNull();
		}
	);

	it.each( [ ...wrappers, [ 'core/quote', 'core/quote' ] ] )(
		'rejects a mixed selection with a disallowed child for %s',
		( destination ) => {
			const block = registerSource( { parent: [ 'core/cover' ] } );
			expect(
				switchToBlockType(
					[ block, createBlock( 'core/paragraph' ) ],
					destination
				)
			).toBeNull();
		}
	);

	it.each( wrappers )(
		'allows an ordinary Paragraph to be wrapped in %s',
		( destination ) => {
			const block = createBlock( 'core/paragraph' );
			expect(
				getPossibleBlockTransformations( [ block ] ).map(
					( { name } ) => name
				)
			).toContain( destination );
			expect( switchToBlockType( block, destination ) ).not.toBeNull();
		}
	);

	it.each( wrappers )(
		'allows matching parent and retained ancestor restrictions for %s',
		( destination, parent ) => {
			const block = registerSource( {
				parent: [ parent ],
				ancestor: [ 'core/cover' ],
			} );
			expect( switchToBlockType( block, destination ) ).not.toBeNull();
		}
	);

	it( 'validates Columns against Column rather than Columns', () => {
		const block = registerSource( { parent: [ 'core/columns' ] } );
		expect( switchToBlockType( block, 'core/columns' ) ).toBeNull();
	} );

	it( 'retains the Columns selection limit', () => {
		const blocks = Array.from( { length: 7 }, () =>
			createBlock( 'core/paragraph' )
		);
		expect( switchToBlockType( blocks, 'core/columns' ) ).toBeNull();
		expect(
			switchToBlockType( blocks.slice( 0, 6 ), 'core/columns' )
		).not.toBeNull();
	} );

	it.each( [ 'core/columns', 'core/details' ] )(
		'does not introduce a single nested %s',
		( name ) => {
			expect( switchToBlockType( createBlock( name ), name ) ).toBeNull();
		}
	);
} );
