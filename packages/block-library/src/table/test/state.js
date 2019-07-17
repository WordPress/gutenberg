/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	createTable,
	updateCellContent,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
	toggleSection,
	isEmptyTableSection,
	isEmptyRow,
	isCellSelected,
	hasSingleCellSelection,
	hasRowSelection,
	hasColumnSelection,
	getCellAbove,
	getCellBelow,
	getCellToLeft,
	getCellToRight,
} from '../state';

const tableWithHeadAndFoot = deepFreeze( {
	head: [
		{
			cells: [
				{
					content: '',
					tag: 'th',
				},
				{
					content: '',
					tag: 'th',
				},
			],
		},
	],
	body: [
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
	],
	foot: [
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
	],
} );

const table = deepFreeze( {
	body: [
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
	],
} );

const tableWithContent = deepFreeze( {
	body: [
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: '',
					tag: 'td',
				},
			],
		},
		{
			cells: [
				{
					content: '',
					tag: 'td',
				},
				{
					content: 'test',
					tag: 'td',
				},
			],
		},
	],
} );

describe( 'createTable', () => {
	it( 'should create a table', () => {
		const state = createTable( { rowCount: 2, columnCount: 2 } );

		expect( state ).toEqual( table );
	} );
} );

describe( 'updateCellContent', () => {
	it( 'should update cell content', () => {
		const state = updateCellContent( table, {
			section: 'body',
			rowIndex: 1,
			columnIndex: 1,
			content: 'test',
		} );

		expect( state ).toEqual( tableWithContent );
	} );
} );

describe( 'insertRow', () => {
	it( 'should insert row', () => {
		const state = insertRow( tableWithContent, {
			section: 'body',
			rowIndex: 2,
		} );

		const expected = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'allows the number of columns to be specified', () => {
		const state = insertRow( tableWithContent, {
			section: 'body',
			rowIndex: 2,
			columnCount: 4,
		} );

		const expected = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds `th` cells to the head', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		const state = insertRow( tableWithHead, {
			section: 'head',
			rowIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );

describe( 'insertColumn', () => {
	it( 'inserts before existing content by default', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: 'test',
							tag: 'th',
						},
					],
				},
			],
		};

		const state = insertColumn( tableWithHead, {
			columnIndex: 0,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: 'test',
							tag: 'th',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'inserts a column for table sections that have existing cells', () => {
		const state = insertColumn( tableWithContent, {
			columnIndex: 2,
		} );

		const expected = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: 'test',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds `th` cells to the head', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		const state = insertColumn( tableWithHead, {
			columnIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'avoids adding cells to empty rows', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
				{
					cells: [],
				},
			],
		};

		const state = insertColumn( tableWithHead, {
			columnIndex: 0,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
				{
					cells: [],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds cells across table sections that already have cells', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = insertColumn( tableWithHead, {
			columnIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds cells only to rows that have enough cells when rows have an unequal number of cells', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '0',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '0',
							tag: 'td',
						},
						{
							content: '1',
							tag: 'td',
						},
						{
							content: '2',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '0',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = insertColumn( tableWithHead, {
			columnIndex: 3,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '0',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '0',
							tag: 'td',
						},
						{
							content: '1',
							tag: 'td',
						},
						{
							content: '2',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '0',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );

describe( 'deleteRow', () => {
	it( 'should delete row', () => {
		const state = deleteRow( tableWithContent, {
			section: 'body',
			rowIndex: 0,
		} );

		const expected = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );

describe( 'deleteColumn', () => {
	it( 'should delete column', () => {
		const state = deleteColumn( tableWithContent, {
			section: 'body',
			columnIndex: 0,
		} );

		const expected = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'should delete all rows when only one column present', () => {
		const tableWithOneColumn = {
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
			],
		};
		const state = deleteColumn( tableWithOneColumn, {
			section: 'body',
			columnIndex: 0,
		} );

		const expected = {
			body: [],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'deletes columns across table sections', () => {
		const tableWithOneColumn = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: 'test',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};
		const state = deleteColumn( tableWithOneColumn, {
			section: 'body',
			columnIndex: 0,
		} );

		const expected = {
			head: [],
			body: [],
			foot: [],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'deletes columns across table sections when there are missing columns', () => {
		const tableWithOneColumn = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = deleteColumn( tableWithOneColumn, {
			section: 'body',
			columnIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );

describe( 'toggleSection', () => {
	it( 'removes rows from the head section if the table already has them', () => {
		const tableWithHead = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		const state = toggleSection( tableWithHead, 'head' );

		const expected = {
			head: [],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds a row to the head section if the table has none', () => {
		const tableWithHead = {
			head: [],
		};

		const state = toggleSection( tableWithHead, 'head' );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'uses the number of cells in the first row of the body for the added table row', () => {
		const tableWithHead = {
			head: [],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = toggleSection( tableWithHead, 'head' );

		const expected = {
			head: [
				{
					cells: [
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );

describe( 'isEmptyTableSection', () => {
	it( 'considers a section empty if it has no rows', () => {
		const tableSection = [];
		expect( isEmptyTableSection( tableSection ) ).toBe( true );
	} );

	it( 'considers a section empty if it has a single row with no cells', () => {
		const tableSection = [
			{
				cells: [],
			},
		];

		expect( isEmptyTableSection( tableSection ) ).toBe( true );
	} );

	it( 'considers a section empty if it has multiple empty rows', () => {
		const tableSection = [
			{
				cells: [],
			},
			{
				cells: [],
			},
		];

		expect( isEmptyTableSection( tableSection ) ).toBe( true );
	} );

	it( 'considers a section not empty if it has a mixture of empty and non-empty rows', () => {
		const tableSection = [
			{
				cells: [],
			},
			{
				cells: [
					{
						content: '',
						tag: 'td',
					},
				],
			},
		];

		expect( isEmptyTableSection( tableSection ) ).toBe( false );
	} );
} );

describe( 'isEmptyRow', () => {
	it( 'considers a row empty if it has undefined cells', () => {
		expect( isEmptyRow( {} ) ).toBe( true );
	} );

	it( 'considers a row empty if it has a zero length array of cells', () => {
		expect( isEmptyRow( { cells: [] } ) ).toBe( true );
	} );

	it( 'considers a row not empty if it has a cell', () => {
		const row = {
			cells: [
				{
					content: '',
					tag: 'td',
				},
			],
		};

		expect( isEmptyRow( row ) ).toBe( false );
	} );
} );

describe( 'isCellSelected', () => {
	it( 'returns false when no cellLocation is provided', () => {
		const tableSelection = { type: 'table' };

		expect( isCellSelected( undefined, tableSelection ) ).toBe( false );
	} );

	it( 'returns false when no selection is provided', () => {
		const cellLocation = { section: 'head', columnIndex: 0, rowIndex: 0 };

		expect( isCellSelected( cellLocation ) ).toBe( false );
	} );

	it( `considers every cell selected when the selection.type is 'table'`, () => {
		const headCellLocationA = { section: 'head', columnIndex: 0, rowIndex: 0 };
		const headCellLocationB = { section: 'head', columnIndex: 999, rowIndex: 999 };
		const bodyCellLocationA = { section: 'body', columnIndex: 0, rowIndex: 0 };
		const bodyCellLocationB = { section: 'body', columnIndex: 999, rowIndex: 999 };
		const footCellLocationA = { section: 'foot', columnIndex: 0, rowIndex: 0 };
		const footCellLocationB = { section: 'foot', columnIndex: 999, rowIndex: 999 };
		const tableSelection = { type: 'table' };

		expect( isCellSelected( headCellLocationA, tableSelection ) ).toBe( true );
		expect( isCellSelected( headCellLocationB, tableSelection ) ).toBe( true );
		expect( isCellSelected( bodyCellLocationA, tableSelection ) ).toBe( true );
		expect( isCellSelected( bodyCellLocationB, tableSelection ) ).toBe( true );
		expect( isCellSelected( footCellLocationA, tableSelection ) ).toBe( true );
		expect( isCellSelected( footCellLocationB, tableSelection ) ).toBe( true );
	} );

	it( `considers only cells with the same columnIndex to be selected when the selection.type is 'column'`, () => {
		// Valid locations and selections.
		const headCellLocationA = { section: 'head', columnIndex: 0, rowIndex: 0 };
		const headCellLocationB = { section: 'head', columnIndex: 0, rowIndex: 1 };
		const bodyCellLocationA = { section: 'body', columnIndex: 0, rowIndex: 0 };
		const bodyCellLocationB = { section: 'body', columnIndex: 0, rowIndex: 1 };
		const footCellLocationA = { section: 'foot', columnIndex: 0, rowIndex: 0 };
		const footCellLocationB = { section: 'foot', columnIndex: 0, rowIndex: 1 };
		const columnSelection = { type: 'column', columnIndex: 0 };

		// Invalid locations and selections.
		const otherColumnCellLocationA = { section: 'head', columnIndex: 1, rowIndex: 0 };
		const otherColumnCellLocationB = { section: 'body', columnIndex: 2, rowIndex: 0 };
		const otherColumnCellLocationC = { section: 'foot', columnIndex: 3, rowIndex: 0 };

		expect( isCellSelected( headCellLocationA, columnSelection ) ).toBe( true );
		expect( isCellSelected( headCellLocationB, columnSelection ) ).toBe( true );
		expect( isCellSelected( bodyCellLocationA, columnSelection ) ).toBe( true );
		expect( isCellSelected( bodyCellLocationB, columnSelection ) ).toBe( true );
		expect( isCellSelected( footCellLocationA, columnSelection ) ).toBe( true );
		expect( isCellSelected( footCellLocationB, columnSelection ) ).toBe( true );
		expect( isCellSelected( otherColumnCellLocationA, columnSelection ) ).toBe( false );
		expect( isCellSelected( otherColumnCellLocationB, columnSelection ) ).toBe( false );
		expect( isCellSelected( otherColumnCellLocationC, columnSelection ) ).toBe( false );
	} );

	it( `considers only cells with the same section and rowIndex to be selected when the selection.type is 'row'`, () => {
		const headCellLocationA = { section: 'head', columnIndex: 0, rowIndex: 0 };
		const headCellLocationB = { section: 'head', columnIndex: 1, rowIndex: 0 };
		const otherSectionCellLocation = { section: 'body', columnIndex: 0, rowIndex: 0 };
		const otherRowCellLocation = { section: 'head', columnIndex: 0, rowIndex: 1 };
		const rowSelection = { type: 'row', section: 'head', rowIndex: 0 };

		expect( isCellSelected( headCellLocationA, rowSelection ) ).toBe( true );
		expect( isCellSelected( headCellLocationB, rowSelection ) ).toBe( true );
		expect( isCellSelected( otherSectionCellLocation, rowSelection ) ).toBe( false );
		expect( isCellSelected( otherRowCellLocation, rowSelection ) ).toBe( false );
	} );

	it( `considers only cells with the same section, columnIndex and rowIndex to be selected when the selection.type is 'cell'`, () => {
		// Valid locations and selections.
		const cellLocation = { section: 'head', columnIndex: 0, rowIndex: 0 };
		const cellSelection = { type: 'cell', section: 'head', rowIndex: 0, columnIndex: 0 };

		// Invalid locations and selections.
		const otherColumnCellLocation = { section: 'head', columnIndex: 1, rowIndex: 0 };
		const otherRowCellLocation = { section: 'head', columnIndex: 0, rowIndex: 1 };
		const bodyCellLocation = { section: 'body', columnIndex: 0, rowIndex: 0 };
		const footCellLocation = { section: 'foot', columnIndex: 0, rowIndex: 0 };

		expect( isCellSelected( cellLocation, cellSelection ) ).toBe( true );
		expect( isCellSelected( otherColumnCellLocation, cellSelection ) ).toBe( false );
		expect( isCellSelected( otherRowCellLocation, cellSelection ) ).toBe( false );
		expect( isCellSelected( bodyCellLocation, cellSelection ) ).toBe( false );
		expect( isCellSelected( footCellLocation, cellSelection ) ).toBe( false );
	} );
} );

describe( 'hasSingleCellSelection', () => {
	it( 'returns false when no cellLocation is provided', () => {
		const cellSelection = { type: 'cell', section: 'head', rowIndex: 0, columnIndex: 0 };

		expect( hasSingleCellSelection( undefined, cellSelection ) ).toBe( false );
	} );

	it( 'returns false when no selection is provided', () => {
		const cellLocation = { section: 'head', columnIndex: 0, rowIndex: 0 };

		expect( hasSingleCellSelection( cellLocation ) ).toBe( false );
	} );

	it( `considers only cells with the same section, columnIndex and rowIndex as the selection to be selected, and the selection type must be 'cell'`, () => {
		// Valid locations and selections.
		const cellLocation = { section: 'head', columnIndex: 0, rowIndex: 0 };
		const cellSelection = { type: 'cell', section: 'head', rowIndex: 0, columnIndex: 0 };

		// Invalid locations and selections.
		const otherColumnCellLocation = { section: 'head', columnIndex: 1, rowIndex: 0 };
		const otherRowCellLocation = { section: 'head', columnIndex: 0, rowIndex: 1 };
		const bodyCellLocation = { section: 'body', columnIndex: 0, rowIndex: 0 };
		const footCellLocation = { section: 'foot', columnIndex: 0, rowIndex: 0 };
		const tableSelection = { type: 'table' };
		const columnSelection = { type: 'column', columnIndex: 0 };
		const rowSelection = { type: 'row', section: 'head', rowIndex: 0 };

		expect( hasSingleCellSelection( cellLocation, cellSelection ) ).toBe( true );
		expect( hasSingleCellSelection( otherColumnCellLocation, cellSelection ) ).toBe( false );
		expect( hasSingleCellSelection( otherRowCellLocation, cellSelection ) ).toBe( false );
		expect( hasSingleCellSelection( bodyCellLocation, cellSelection ) ).toBe( false );
		expect( hasSingleCellSelection( footCellLocation, cellSelection ) ).toBe( false );
		expect( hasSingleCellSelection( cellLocation, tableSelection ) ).toBe( false );
		expect( hasSingleCellSelection( cellLocation, columnSelection ) ).toBe( false );
		expect( hasSingleCellSelection( cellLocation, rowSelection ) ).toBe( false );
	} );
} );

describe( 'hasRowSelection', () => {
	it( 'returns false when no cellLocation is provided', () => {
		const rowSelection = { type: 'row', section: 'head', rowIndex: 0 };

		expect( hasRowSelection( undefined, rowSelection ) ).toBe( false );
	} );

	it( 'returns false when no selection is provided', () => {
		const rowLocation = { section: 'head', rowIndex: 0 };

		expect( hasRowSelection( rowLocation ) ).toBe( false );
	} );

	it( `considers only rows with the same section and rowIndex as the selection to be selected, and the selection type must be 'row'`, () => {
		// Valid locations and selections.
		const rowLocationA = { section: 'head', rowIndex: 0 };
		const rowSelection = { type: 'row', section: 'head', rowIndex: 0 };

		// Invalid locations and selections.
		const otherRowLocation = { section: 'head', rowIndex: 1 };
		const bodyCellLocation = { section: 'body', rowIndex: 0 };
		const footCellLocation = { section: 'foot', rowIndex: 0 };
		const cellSelection = { type: 'cell', section: 'head', rowIndex: 0, columnIndex: 0 };
		const tableSelection = { type: 'table' };
		const columnSelection = { type: 'column', columnIndex: 0 };

		expect( hasRowSelection( rowLocationA, rowSelection ) ).toBe( true );
		expect( hasRowSelection( otherRowLocation, rowSelection ) ).toBe( false );
		expect( hasRowSelection( bodyCellLocation, rowSelection ) ).toBe( false );
		expect( hasRowSelection( footCellLocation, rowSelection ) ).toBe( false );
		expect( hasRowSelection( rowLocationA, tableSelection ) ).toBe( false );
		expect( hasRowSelection( rowLocationA, columnSelection ) ).toBe( false );
		expect( hasRowSelection( rowLocationA, cellSelection ) ).toBe( false );
	} );
} );

describe( 'hasColumnSelection', () => {
	it( 'returns false when no cellLocation is provided', () => {
		const columnSelection = { type: 'column', columnIndex: 0 };

		expect( hasColumnSelection( undefined, columnSelection ) ).toBe( false );
	} );

	it( 'returns false when no selection is provided', () => {
		const columnLocation = { columnIndex: 0 };

		expect( hasColumnSelection( columnLocation ) ).toBe( false );
	} );

	it( `considers only cells with the same section and columnIndex as the selection to be selected, and the selection type must be 'column'`, () => {
		// Valid locations and selections.
		const columnLocationHead = { section: 'head', columnIndex: 0 };
		const columnLocationBody = { section: 'body', columnIndex: 0 };
		const columnLocationFoot = { section: 'foot', columnIndex: 0 };
		const columnSelection = { type: 'column', columnIndex: 0 };

		// Invalid locations and selections.
		const otherColumnLocation = { section: 'head', columnIndex: 1 };
		const tableSelection = { type: 'table' };
		const rowSelection = { type: 'row', section: 'head', rowIndex: 0 };
		const cellSelection = { type: 'cell', section: 'head', columnIndex: 0, rowIndex: 0 };

		expect( hasColumnSelection( columnLocationHead, columnSelection ) ).toBe( true );
		expect( hasColumnSelection( columnLocationBody, columnSelection ) ).toBe( true );
		expect( hasColumnSelection( columnLocationFoot, columnSelection ) ).toBe( true );
		expect( hasColumnSelection( otherColumnLocation, columnSelection ) ).toBe( false );
		expect( hasColumnSelection( columnLocationHead, tableSelection ) ).toBe( false );
		expect( hasColumnSelection( columnLocationHead, rowSelection ) ).toBe( false );
		expect( hasColumnSelection( columnLocationHead, cellSelection ) ).toBe( false );
	} );
} );

describe( 'getCellAbove', () => {
	it( `returns undefined for the first row of 'head' section`, () => {
		const cellLocation = { section: 'head', rowIndex: 0, columnIndex: 0 };
		expect( getCellAbove( tableWithHeadAndFoot, cellLocation ) ).toBeUndefined();
	} );

	it( `returns undefined for the first row of 'body' section if the 'head' section is empty`, () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 0 };
		expect( getCellAbove( table, cellLocation ) ).toBeUndefined();
	} );

	it( `returns undefined if the row above does not have as many cells`, () => {
		const cellLocation = { section: 'body', rowIndex: 1, columnIndex: 2 };
		expect( getCellAbove( table, cellLocation ) ).toBeUndefined();
	} );

	it( `returns the location for the row above in the same section when that row exists`, () => {
		const cellLocation = { section: 'body', rowIndex: 1, columnIndex: 0 };
		expect( getCellAbove( table, cellLocation ) ).toEqual( { section: 'body', rowIndex: 0, columnIndex: 0 } );
	} );

	it( `returns the location for the row above in the previous section when that row exists`, () => {
		const bodyCellLocation = { section: 'body', rowIndex: 0, columnIndex: 0 };
		const footCellLocation = { section: 'foot', rowIndex: 0, columnIndex: 0 };

		expect( getCellAbove( tableWithHeadAndFoot, bodyCellLocation ) ).toEqual( {
			section: 'head',
			rowIndex: 0,
			columnIndex: 0,
		} );
		expect( getCellAbove( tableWithHeadAndFoot, footCellLocation ) ).toEqual( {
			section: 'body',
			rowIndex: 1,
			columnIndex: 0,
		} );
	} );
} );

describe( 'getCellBelow', () => {
	it( `returns undefined for the last row of 'foot' section`, () => {
		const cellLocation = { section: 'foot', rowIndex: 0, columnIndex: 0 };
		expect( getCellBelow( tableWithHeadAndFoot, cellLocation ) ).toBeUndefined();
	} );

	it( `returns undefined for the last row of 'body' section if the 'foot' section is empty`, () => {
		const cellLocation = { section: 'body', rowIndex: 1, columnIndex: 0 };
		expect( getCellBelow( table, cellLocation ) ).toBeUndefined();
	} );

	it( `returns undefined if the row below does not have as many cells`, () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 2 };
		expect( getCellBelow( table, cellLocation ) ).toBeUndefined();
	} );

	it( `returns the location for the row below in the same section when that row exists`, () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 0 };
		expect( getCellBelow( table, cellLocation ) ).toEqual( { section: 'body', rowIndex: 1, columnIndex: 0 } );
	} );

	it( `returns the location for the row below in the next section when that row exists`, () => {
		const bodyCellLocation = { section: 'head', rowIndex: 0, columnIndex: 0 };
		expect( getCellBelow( tableWithHeadAndFoot, bodyCellLocation ) ).toEqual( {
			section: 'body',
			rowIndex: 0,
			columnIndex: 0,
		} );

		const footCellLocation = { section: 'body', rowIndex: 1, columnIndex: 0 };
		expect( getCellBelow( tableWithHeadAndFoot, footCellLocation ) ).toEqual( {
			section: 'foot',
			rowIndex: 0,
			columnIndex: 0,
		} );
	} );
} );

describe( 'getCellToRight', () => {
	it( 'returns undefined if there is no cell to the right', () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 1 };
		expect( getCellToRight( table, cellLocation ) ).toBeUndefined();
	} );

	it( 'returns the location of the cell to the right if it exists', () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 0 };
		expect( getCellToRight( table, cellLocation ) ).toEqual( {
			section: 'body',
			rowIndex: 0,
			columnIndex: 1,
		} );
	} );
} );

describe( 'getCellToLeft', () => {
	it( 'returns undefined if there is no cell to the left', () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 0 };
		expect( getCellToLeft( cellLocation ) ).toBeUndefined();
	} );

	it( 'returns the location of the cell to the left if it exists', () => {
		const cellLocation = { section: 'body', rowIndex: 0, columnIndex: 1 };
		expect( getCellToLeft( cellLocation ) ).toEqual( {
			section: 'body',
			rowIndex: 0,
			columnIndex: 0,
		} );
	} );
} );
