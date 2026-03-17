/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	createTable,
	getFirstRow,
	getCellAttribute,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
	toggleSection,
	isEmptyTableSection,
	isEmptyRow,
	isCellSelected,
	updateSelectedCell,
} from '../state';

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

const tableWithHead = deepFreeze( {
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
} );

const tableWithFoot = deepFreeze( {
	foot: [
		{
			cells: [
				{
					content: 'test',
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

const tableWithAttribute = deepFreeze( {
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
					testAttr: 'testVal',
					content: '',
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

describe( 'getFirstRow', () => {
	it( 'returns the first row in the head when the body is the first table section', () => {
		expect( getFirstRow( tableWithHead ) ).toBe( tableWithHead.head[ 0 ] );
	} );

	it( 'returns the first row in the body when the body is the first table section', () => {
		expect( getFirstRow( table ) ).toBe( table.body[ 0 ] );
	} );

	it( 'returns the first row in the foot when the body is the first table section', () => {
		expect( getFirstRow( tableWithFoot ) ).toBe( tableWithFoot.foot[ 0 ] );
	} );

	it( 'returns `undefined` for an empty table', () => {
		expect( getFirstRow( {} ) ).toBeUndefined();
	} );
} );

describe( 'getCellAttribute', () => {
	it( 'should get the cell attribute', () => {
		const cellLocation = {
			sectionName: 'body',
			rowIndex: 1,
			columnIndex: 1,
		};
		const state = getCellAttribute(
			tableWithAttribute,
			cellLocation,
			'testAttr'
		);

		expect( state ).toBe( 'testVal' );
	} );
} );

describe( 'insertRow', () => {
	it( 'should insert row', () => {
		const state = insertRow( tableWithContent, {
			sectionName: 'body',
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
			sectionName: 'body',
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

	it( 'inherits the `align` property from the first cell in the column when adding a new row', () => {
		const tableWithAlignment = {
			body: [
				{
					cells: [
						{
							align: 'right',
							content: 'test',
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

		const state = insertRow( tableWithAlignment, {
			sectionName: 'body',
			rowIndex: 1,
		} );

		expect( state ).toEqual( {
			body: [
				{
					cells: [
						{
							align: 'right',
							content: 'test',
							tag: 'th',
						},
						{
							content: '',
							tag: 'th',
						},
					],
				},
				{
					cells: [
						{
							align: 'right',
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
	} );

	it( 'adds `th` cells to the head', () => {
		const state = insertRow( tableWithHead, {
			sectionName: 'head',
			rowIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: 'test',
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

	it( 'should have no effect if `columnCount` is not provided and the table has no existing rows', () => {
		const existingState = { body: {} };
		const newState = insertRow( existingState, {
			sectionName: 'body',
			rowIndex: 0,
		} );

		expect( newState ).toBe( existingState );
	} );

	it( 'should have no effect if `columnCount` is `0`', () => {
		const state = insertRow( tableWithHead, {
			sectionName: 'head',
			rowIndex: 1,
			columnCount: 0,
		} );

		expect( state ).toBe( tableWithHead );
	} );
} );

describe( 'insertColumn', () => {
	it( 'inserts before existing content by default', () => {
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
		const state = insertColumn( tableWithHead, {
			columnIndex: 1,
		} );

		const expected = {
			head: [
				{
					cells: [
						{
							content: 'test',
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
		const tableWithEmptyRow = {
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

		const state = insertColumn( tableWithEmptyRow, {
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

	it( 'adds cells across table sections that already have rows', () => {
		const tableWithAllSections = {
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

		const state = insertColumn( tableWithAllSections, {
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
		const tableWithUnequalColumns = {
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

		const state = insertColumn( tableWithUnequalColumns, {
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
			sectionName: 'body',
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
		const state = toggleSection( tableWithHead, 'head' );

		const expected = {
			head: [],
		};

		expect( state ).toEqual( expected );
	} );

	it( 'adds a row to the head section if the table has none', () => {
		const tableWithEmptyHead = {
			head: [],
		};

		const state = toggleSection( tableWithEmptyHead, 'head' );

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
		const tableWithEmptyHead = {
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

		const state = toggleSection( tableWithEmptyHead, 'head' );

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
		const cellLocation = {
			sectionName: 'head',
			columnIndex: 0,
			rowIndex: 0,
		};

		expect( isCellSelected( cellLocation ) ).toBe( false );
	} );

	it( `considers only cells with the same columnIndex to be selected when the selection.type is 'column'`, () => {
		// Valid locations and selections.
		const headCellLocationA = {
			sectionName: 'head',
			columnIndex: 0,
			rowIndex: 0,
		};
		const headCellLocationB = {
			sectionName: 'head',
			columnIndex: 0,
			rowIndex: 1,
		};
		const bodyCellLocationA = {
			sectionName: 'body',
			columnIndex: 0,
			rowIndex: 0,
		};
		const bodyCellLocationB = {
			sectionName: 'body',
			columnIndex: 0,
			rowIndex: 1,
		};
		const footCellLocationA = {
			sectionName: 'foot',
			columnIndex: 0,
			rowIndex: 0,
		};
		const footCellLocationB = {
			sectionName: 'foot',
			columnIndex: 0,
			rowIndex: 1,
		};
		const columnSelection = { type: 'column', columnIndex: 0 };

		// Invalid locations and selections.
		const otherColumnCellLocationA = {
			sectionName: 'head',
			columnIndex: 1,
			rowIndex: 0,
		};
		const otherColumnCellLocationB = {
			sectionName: 'body',
			columnIndex: 2,
			rowIndex: 0,
		};
		const otherColumnCellLocationC = {
			sectionName: 'foot',
			columnIndex: 3,
			rowIndex: 0,
		};

		expect( isCellSelected( headCellLocationA, columnSelection ) ).toBe(
			true
		);
		expect( isCellSelected( headCellLocationB, columnSelection ) ).toBe(
			true
		);
		expect( isCellSelected( bodyCellLocationA, columnSelection ) ).toBe(
			true
		);
		expect( isCellSelected( bodyCellLocationB, columnSelection ) ).toBe(
			true
		);
		expect( isCellSelected( footCellLocationA, columnSelection ) ).toBe(
			true
		);
		expect( isCellSelected( footCellLocationB, columnSelection ) ).toBe(
			true
		);
		expect(
			isCellSelected( otherColumnCellLocationA, columnSelection )
		).toBe( false );
		expect(
			isCellSelected( otherColumnCellLocationB, columnSelection )
		).toBe( false );
		expect(
			isCellSelected( otherColumnCellLocationC, columnSelection )
		).toBe( false );
	} );

	it( `considers only cells with the same section, columnIndex and rowIndex to be selected when the selection.type is 'cell'`, () => {
		// Valid locations and selections.
		const cellLocation = {
			sectionName: 'head',
			columnIndex: 0,
			rowIndex: 0,
		};
		const cellSelection = {
			type: 'cell',
			sectionName: 'head',
			rowIndex: 0,
			columnIndex: 0,
		};

		// Invalid locations and selections.
		const otherColumnCellLocation = {
			sectionName: 'head',
			columnIndex: 1,
			rowIndex: 0,
		};
		const otherRowCellLocation = {
			sectionName: 'head',
			columnIndex: 0,
			rowIndex: 1,
		};
		const bodyCellLocation = {
			sectionName: 'body',
			columnIndex: 0,
			rowIndex: 0,
		};
		const footCellLocation = {
			sectionName: 'foot',
			columnIndex: 0,
			rowIndex: 0,
		};

		expect( isCellSelected( cellLocation, cellSelection ) ).toBe( true );
		expect( isCellSelected( otherColumnCellLocation, cellSelection ) ).toBe(
			false
		);
		expect( isCellSelected( otherRowCellLocation, cellSelection ) ).toBe(
			false
		);
		expect( isCellSelected( bodyCellLocation, cellSelection ) ).toBe(
			false
		);
		expect( isCellSelected( footCellLocation, cellSelection ) ).toBe(
			false
		);
	} );
} );

describe( 'updateSelectedCell', () => {
	it( 'returns an unchanged table state if there is no selection', () => {
		const updated = updateSelectedCell( table, undefined, ( cell ) => ( {
			...cell,
			content: 'test',
		} ) );
		expect( table ).toEqual( updated );
	} );

	it( 'returns an unchanged table state if the selection is outside the bounds of the table', () => {
		const cellSelection = {
			type: 'cell',
			sectionName: 'body',
			rowIndex: 100,
			columnIndex: 100,
		};
		const updated = updateSelectedCell(
			table,
			cellSelection,
			( cell ) => ( {
				...cell,
				content: 'test',
			} )
		);
		expect( table ).toEqual( updated );
	} );

	it( 'updates only the individual cell when the selection type is `cell`', () => {
		const cellSelection = {
			type: 'cell',
			sectionName: 'body',
			rowIndex: 0,
			columnIndex: 0,
		};
		const updated = updateSelectedCell(
			table,
			cellSelection,
			( cell ) => ( {
				...cell,
				content: 'test',
			} )
		);

		expect( updated ).toEqual( {
			body: [
				{
					cells: [
						{
							...table.body[ 0 ].cells[ 0 ],
							content: 'test',
						},
						table.body[ 0 ].cells[ 1 ],
					],
				},
				table.body[ 1 ],
			],
		} );
	} );

	it( 'updates every cell in the column when the selection type is `column`', () => {
		const cellSelection = { type: 'column', columnIndex: 1 };
		const updated = updateSelectedCell(
			table,
			cellSelection,
			( cell ) => ( {
				...cell,
				content: 'test',
			} )
		);

		expect( updated ).toEqual( {
			body: [
				{
					cells: [
						table.body[ 0 ].cells[ 0 ],
						{
							...table.body[ 0 ].cells[ 1 ],
							content: 'test',
						},
					],
				},
				{
					cells: [
						table.body[ 1 ].cells[ 0 ],
						{
							...table.body[ 1 ].cells[ 1 ],
							content: 'test',
						},
					],
				},
			],
		} );
	} );
} );
