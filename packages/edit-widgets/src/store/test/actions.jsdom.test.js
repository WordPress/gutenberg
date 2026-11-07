import { describe, expect, it, vi } from 'vitest';
import { saveWidgetArea } from '../actions';

// Only the store descriptors are imported from these packages; stub them so
// their browser-only side effects do not run.
vi.mock( import( '@wordpress/interface' ), () => ( {
	store: 'core/interface',
} ) );
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	store: 'core/block-editor',
} ) );
vi.mock( import( '@wordpress/notices' ), () => ( { store: 'core/notices' } ) );

vi.mock( import( '../transformers' ), () => ( {
	transformBlockToWidget: ( block, relatedWidget = {} ) => ( {
		...relatedWidget,
		id_base: 'block',
		instance: { raw: { content: block.attributes.content } },
	} ),
} ) );

function setup(
	blocks,
	widgets,
	{ area = 'sidebar-1', areaHoldingId = 'sidebar-1' } = {}
) {
	let nextWidgetNumber = 10;
	const saveEntityRecord = vi.fn( () => ( {
		id: `block-${ nextWidgetNumber++ }`,
	} ) );
	const saveEditedEntityRecord = vi.fn( ( kind, name, id ) => ( { id } ) );
	const coreDispatch = {
		editEntityRecord: vi.fn(),
		receiveEntityRecords: vi.fn(),
		saveEditedEntityRecord: vi.fn(),
		__experimentalBatch: vi.fn( async ( tasks ) =>
			Promise.all(
				tasks.map( ( task ) =>
					task( { saveEntityRecord, saveEditedEntityRecord } )
				)
			)
		),
	};
	const coreSelect = {
		getEditedEntityRecord: () => ( { blocks } ),
		hasEditsForEntityRecord: () => true,
		getLastEntitySaveError: () => undefined,
	};
	const registry = {
		select: () => coreSelect,
		dispatch: () => coreDispatch,
	};
	const select = {
		getWidgets: () => widgets,
		getWidgetAreaForWidgetId: () => ( { id: areaHoldingId } ),
	};
	return {
		run: () =>
			saveWidgetArea( area )( {
				dispatch: vi.fn(),
				select,
				registry,
			} ),
		coreDispatch,
		saveEntityRecord,
		saveEditedEntityRecord,
	};
}

describe( 'saveWidgetArea', () => {
	it( 'saves a block that shares an existing widget ID with an earlier block as a new widget', async () => {
		// Splitting a paragraph widget copies the block's attributes,
		// including `__internalWidgetId`, to the new block.
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'head',
				attributes: { content: 'Hello', __internalWidgetId: 'block-2' },
			},
			{
				name: 'core/paragraph',
				clientId: 'tail',
				attributes: { content: 'world', __internalWidgetId: 'block-2' },
			},
		];
		const widgets = {
			'block-2': {
				id: 'block-2',
				id_base: 'block',
				sidebar: 'sidebar-1',
			},
		};
		const { run, coreDispatch, saveEntityRecord, saveEditedEntityRecord } =
			setup( blocks, widgets );

		await run();

		const widgetEdits = coreDispatch.editEntityRecord.mock.calls.filter(
			( [ kind, name ] ) => kind === 'root' && name === 'widget'
		);
		expect( widgetEdits ).toHaveLength( 1 );
		expect( widgetEdits[ 0 ][ 3 ].instance.raw.content ).toBe( 'Hello' );
		expect( saveEditedEntityRecord ).toHaveBeenCalledTimes( 1 );
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );
		expect( saveEntityRecord.mock.calls[ 0 ][ 2 ] ).toMatchObject( {
			sidebar: 'sidebar-1',
			instance: { raw: { content: 'world' } },
		} );

		expect( coreDispatch.editEntityRecord ).toHaveBeenCalledWith(
			'root',
			'sidebar',
			'sidebar-1',
			{ widgets: [ 'block-2', 'block-10' ] },
			{ undoIgnore: true }
		);
		expect( blocks[ 1 ].attributes.__internalWidgetId ).toBe( 'block-10' );
	} );

	it( 'keeps updating existing widgets when every block has its own widget ID', async () => {
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'a',
				attributes: { content: 'A', __internalWidgetId: 'block-2' },
			},
			{
				name: 'core/paragraph',
				clientId: 'b',
				attributes: { content: 'B', __internalWidgetId: 'block-3' },
			},
		];
		const widgets = {
			'block-2': {
				id: 'block-2',
				id_base: 'block',
				sidebar: 'sidebar-1',
			},
			'block-3': {
				id: 'block-3',
				id_base: 'block',
				sidebar: 'sidebar-1',
			},
		};
		const { run, coreDispatch, saveEntityRecord, saveEditedEntityRecord } =
			setup( blocks, widgets );

		await run();

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( saveEditedEntityRecord ).toHaveBeenCalledTimes( 2 );
		expect( coreDispatch.editEntityRecord ).toHaveBeenCalledWith(
			'root',
			'sidebar',
			'sidebar-1',
			{ widgets: [ 'block-2', 'block-3' ] },
			{ undoIgnore: true }
		);
	} );

	it( 'saves a block as a new widget when an earlier widget area holds the same widget ID', async () => {
		// The new block from a split was moved to another widget area, so both
		// areas hold a block with `block-2`. The first area keeps the widget.
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'tail',
				attributes: { content: 'world', __internalWidgetId: 'block-2' },
			},
		];
		const widgets = {
			'block-2': {
				id: 'block-2',
				id_base: 'block',
				sidebar: 'sidebar-1',
			},
		};
		const { run, coreDispatch, saveEntityRecord, saveEditedEntityRecord } =
			setup( blocks, widgets, {
				area: 'sidebar-2',
				areaHoldingId: 'sidebar-1',
			} );

		await run();

		expect( saveEditedEntityRecord ).not.toHaveBeenCalled();
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );
		expect( saveEntityRecord.mock.calls[ 0 ][ 2 ] ).toMatchObject( {
			sidebar: 'sidebar-2',
		} );
		expect( coreDispatch.editEntityRecord ).toHaveBeenCalledWith(
			'root',
			'sidebar',
			'sidebar-2',
			{ widgets: [ 'block-10' ] },
			{ undoIgnore: true }
		);
	} );

	it( 'keeps updating a widget that was moved to another widget area', async () => {
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'moved',
				attributes: { content: 'Moved', __internalWidgetId: 'block-2' },
			},
		];
		const widgets = {
			'block-2': {
				id: 'block-2',
				id_base: 'block',
				sidebar: 'sidebar-1',
			},
		};
		const { run, saveEntityRecord, saveEditedEntityRecord } = setup(
			blocks,
			widgets,
			{ area: 'sidebar-2', areaHoldingId: 'sidebar-2' }
		);

		await run();

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( saveEditedEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			'block-2'
		);
	} );
} );
