/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import {
	type CRDTDoc,
	type ObjectData,
	type SyncConfig,
	Y,
} from '@wordpress/sync';

/**
 * Mock sync providers so the SyncManager test can deterministically deliver
 * normal Yjs updates after both collaborators make local table edits.
 */
jest.mock( '../../../../sync/src/providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	getBlockTypes: () => [
		{
			name: 'core/table',
			attributes: {
				body: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
							},
						},
					},
				},
			},
		},
	],
} ) );

/**
 * Internal dependencies
 */
import { createSyncManager } from '../../../../sync/src/manager';
import { getProviderCreators } from '../../../../sync/src/providers';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import {
	deserializeBlockAttributes,
	mergeCrdtBlocks,
	type Block,
	type YBlock,
} from '../crdt-blocks';

const OBJECT_TYPE = 'postType/post';
const OBJECT_ID = '1';
const EDITED_MARKER = 'edited-second-duplicate-body-marker';
const INITIAL_ROWS = [ 'anchor', 'same', 'same' ];
const mockGetProviderCreators = jest.mocked( getProviderCreators );

type TableCell = {
	content?: unknown;
	tag?: string;
	[ key: string ]: unknown;
};

type TableRow = {
	cells: TableCell[];
	[ key: string ]: unknown;
};

function createTableBlock( values: string[] ): Block {
	return {
		name: 'core/table',
		clientId: 'table',
		attributes: {
			body: values.map( ( value ) => ( {
				cells: [
					{
						content: value,
						tag: 'td',
					},
				],
			} ) ),
		},
		innerBlocks: [],
	};
}

function createTableBlockFromRows(
	sourceBlock: Block,
	rows: TableRow[]
): Block {
	return {
		...sourceBlock,
		attributes: {
			...sourceBlock.attributes,
			body: rows,
		},
	};
}

function cloneBlocks( blocks: Block[] ): Block[] {
	return JSON.parse( JSON.stringify( blocks ) ) as Block[];
}

function getBlocksArray( ydoc: CRDTDoc ): Y.Array< YBlock > {
	const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
	let blocks = recordMap.get( 'blocks' );

	if ( ! ( blocks instanceof Y.Array ) ) {
		blocks = new Y.Array< YBlock >();
		recordMap.set( 'blocks', blocks );
	}

	return blocks as Y.Array< YBlock >;
}

function applyTableRows( ydoc: CRDTDoc, values: string[] ) {
	mergeCrdtBlocks(
		getBlocksArray( ydoc ),
		[ createTableBlock( values ) ],
		null
	);
}

function getSerializableBlocks( ydoc: CRDTDoc ): Block[] {
	return getBlocksArray( ydoc ).toJSON() as Block[];
}

function getTableRowsFromBlocks( blocks: Block[] ): TableRow[] {
	return ( blocks[ 0 ]?.attributes.body ?? [] ) as TableRow[];
}

function createBlocksWithEditedTableRow(
	ydoc: CRDTDoc,
	index: number,
	content: string
): Block[] {
	const blocks = getSerializableBlocks( ydoc );
	const rows = getTableRowsFromBlocks( blocks ).map( ( row, rowIndex ) => {
		if ( rowIndex !== index ) {
			return row;
		}

		return {
			...row,
			cells: row.cells.map( ( cell, cellIndex ) =>
				cellIndex === 0 ? { ...cell, content } : cell
			),
		};
	} );

	return [ createTableBlockFromRows( blocks[ 0 ], rows ) ];
}

function createBlocksWithDeletedTableRow(
	ydoc: CRDTDoc,
	index: number
): Block[] {
	const blocks = getSerializableBlocks( ydoc );
	const rows = getTableRowsFromBlocks( blocks ).filter(
		( _row, rowIndex ) => rowIndex !== index
	);

	return [ createTableBlockFromRows( blocks[ 0 ], rows ) ];
}

function getTableCellContents( ydoc: CRDTDoc ): string[] {
	const body = getTableRowsFromBlocks( getSerializableBlocks( ydoc ) );

	return ( body ?? [] ).map( ( row ) => String( row.cells[ 0 ].content ) );
}

function syncDocs( first: CRDTDoc, second: CRDTDoc ) {
	Y.applyUpdateV2( second, Y.encodeStateAsUpdateV2( first ) );
	Y.applyUpdateV2( first, Y.encodeStateAsUpdateV2( second ) );
}

function createBlocksSyncConfig(
	onApply?: ( ydoc: CRDTDoc ) => void
): SyncConfig {
	return {
		applyChangesToCRDTDoc: ( ydoc: CRDTDoc, changes: ObjectData ) => {
			onApply?.( ydoc );
			const blocks = changes.blocks as Block[] | undefined;

			if ( blocks ) {
				mergeCrdtBlocks( getBlocksArray( ydoc ), blocks, null );
			}
		},
		getChangesFromCRDTDoc: ( ydoc: CRDTDoc, editedRecord: ObjectData ) => {
			const blocks = deserializeBlockAttributes(
				getBlocksArray( ydoc ).toJSON() as Block[]
			);

			return JSON.stringify( blocks ) ===
				JSON.stringify( editedRecord.blocks )
				? {}
				: { blocks };
		},
		getPersistedCRDTDoc: () => null,
	};
}

function createHandlers( blocks: Block[] ) {
	let editedBlocks = cloneBlocks( blocks );

	return {
		addUndoMeta: jest.fn(),
		editRecord: jest.fn( ( changes: { blocks?: Block[] } ) => {
			if ( changes.blocks ) {
				editedBlocks = cloneBlocks( changes.blocks );
			}
		} ),
		getEditedRecord: jest.fn( async () => ( {
			id: 1,
			blocks: cloneBlocks( editedBlocks ),
		} ) ),
		onUndoStackChange: jest.fn(),
		onStatusChange: jest.fn(),
		persistCRDTDoc: jest.fn(),
		refetchRecord: jest.fn( async () => {} ),
		restoreUndoMeta: jest.fn(),
	};
}

function waitForDeferredUpdate() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'duplicate table body revision loss', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetProviderCreators.mockReturnValue( [
			jest.fn( async () => ( {
				destroy: jest.fn(),
				on: jest.fn(),
			} ) ),
		] );
	} );

	it( 'does not lose a later duplicate table row edit when another session deletes the earlier duplicate row', () => {
		const editorDoc = new Y.Doc();
		const deleterDoc = new Y.Doc();

		try {
			// Old/no-CRDT posts can be independently bootstrapped from the same
			// serialized table body in two browser sessions.
			applyTableRows( editorDoc, INITIAL_ROWS );
			applyTableRows( deleterDoc, INITIAL_ROWS );
			syncDocs( editorDoc, deleterDoc );

			mergeCrdtBlocks(
				getBlocksArray( editorDoc ),
				createBlocksWithEditedTableRow( editorDoc, 2, EDITED_MARKER ),
				null
			);
			mergeCrdtBlocks(
				getBlocksArray( deleterDoc ),
				createBlocksWithDeletedTableRow( deleterDoc, 1 ),
				null
			);
			syncDocs( editorDoc, deleterDoc );

			expect( getTableCellContents( editorDoc ) ).toContain(
				EDITED_MARKER
			);
			expect( getTableCellContents( deleterDoc ) ).toContain(
				EDITED_MARKER
			);
		} finally {
			editorDoc.destroy();
			deleterDoc.destroy();
		}
	} );

	it( 'does not let SyncManager lose a duplicate table row edit after independent no-CRDT bootstraps', async () => {
		let editorDoc: CRDTDoc | undefined;
		let deleterDoc: CRDTDoc | undefined;
		const editorManager = createSyncManager();
		const deleterManager = createSyncManager();
		const initialBlocks = [ createTableBlock( INITIAL_ROWS ) ];

		await editorManager.load(
			createBlocksSyncConfig( ( ydoc ) => {
				editorDoc = ydoc;
			} ),
			OBJECT_TYPE,
			OBJECT_ID,
			{ id: 1, blocks: initialBlocks },
			createHandlers( initialBlocks )
		);
		await deleterManager.load(
			createBlocksSyncConfig( ( ydoc ) => {
				deleterDoc = ydoc;
			} ),
			OBJECT_TYPE,
			OBJECT_ID,
			{ id: 1, blocks: initialBlocks },
			createHandlers( initialBlocks )
		);

		expect( editorDoc ).toBeDefined();
		expect( deleterDoc ).toBeDefined();
		syncDocs( editorDoc as CRDTDoc, deleterDoc as CRDTDoc );

		editorManager.update(
			OBJECT_TYPE,
			OBJECT_ID,
			{
				blocks: createBlocksWithEditedTableRow(
					editorDoc as CRDTDoc,
					2,
					EDITED_MARKER
				),
			},
			'LOCAL_EDITOR_ORIGIN'
		);
		deleterManager.update(
			OBJECT_TYPE,
			OBJECT_ID,
			{
				blocks: createBlocksWithDeletedTableRow(
					deleterDoc as CRDTDoc,
					1
				),
			},
			'LOCAL_EDITOR_ORIGIN'
		);
		await waitForDeferredUpdate();
		syncDocs( editorDoc as CRDTDoc, deleterDoc as CRDTDoc );
		await waitForDeferredUpdate();

		expect( getTableCellContents( editorDoc as CRDTDoc ) ).toContain(
			EDITED_MARKER
		);
		expect( getTableCellContents( deleterDoc as CRDTDoc ) ).toContain(
			EDITED_MARKER
		);
	} );
} );
