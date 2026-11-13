import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	createTable,
	getFirstRow,
	getCellAttribute,
	getCellColumnRange,
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

const tableWithRowspanHead = deepFreeze( {
	head: [
		{
			cells: [
				{ content: 'A', tag: 'th', rowspan: '2' },
				{ content: 'B', tag: 'th', rowspan: '2' },
				{
					content: 'Grouped',
					tag: 'th',
					align: 'center',
					colspan: '2',
				},
				{ content: 'E', tag: 'th', rowspan: '2' },
			],
		},
		{
			cells: [
				{ content: 'Sub C', tag: 'th' },
				{ content: 'Sub D', tag: 'th' },
			],
		},
	],
	body: [
		{
			cells: [
				{ content: 'A1', tag: 'td' },
				{ content: 'B1', tag: 'td' },
				{ content: 'C1', tag: 'td' },
				{ content: 'D1', tag: 'td' },
				{ content: 'E1', tag: 'td' },
			],
		},
	],
} );

const tableWithTallRowspan = deepFreeze( {
	body: [
		{
			cells: [
				{ content: 'A', tag: 'td', rowspan: '3' },
				{ content: 'B', tag: 'td' },
			],
		},
		{ cells: [ { content: 'C', tag: 'td' } ] },
		{ cells: [ { content: 'D', tag: 'td' } ] },
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

describe( 'getCellColumnRange', () => {
	it( 'returns the logical columns covered by a cell', () => {
		// "Sub C" is the first cell of its row, but starts at column 2
		// because "A" and "B" span down into the row.
		expect(
			getCellColumnRange( tableWithRowspanHead, {
				sectionName: 'head',
				rowIndex: 1,
				columnIndex: 0,
			} )
		).toEqual( { columnIndex: 2, colspan: 1 } );

		expect(
			getCellColumnRange( tableWithRowspanHead, {
				sectionName: 'head',
				rowIndex: 0,
				columnIndex: 2,
			} )
		).toEqual( { columnIndex: 2, colspan: 2 } );
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

	it( 'uses the logical column count when the first row contains colspan', () => {
		const tableWithColspan = {
			head: [
				{
					cells: [
						{
							content: 'A',
							tag: 'th',
							rowspan: '2',
						},
						{
							content: 'B',
							tag: 'th',
							rowspan: '2',
						},
						{
							content: 'Grouped',
							tag: 'th',
							colspan: '2',
						},
						{
							content: 'E',
							tag: 'th',
							rowspan: '2',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: 'A1',
							tag: 'td',
						},
						{
							content: 'B1',
							tag: 'td',
						},
						{
							content: 'C1',
							tag: 'td',
						},
						{
							content: 'D1',
							tag: 'td',
						},
						{
							content: 'E1',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = insertRow( tableWithColspan, {
			sectionName: 'body',
			rowIndex: 1,
		} );

		expect( state.body[ 1 ].cells ).toHaveLength( 5 );
	} );

	it( 'treats an invalid colspan in the first row as 1', () => {
		const tableWithInvalidColspan = {
			body: [
				{
					cells: [
						{
							align: 'left',
							content: 'A',
							tag: 'td',
							colspan: 'abc',
						},
						{
							align: 'right',
							content: 'B',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = insertRow( tableWithInvalidColspan, {
			sectionName: 'body',
			rowIndex: 1,
		} );

		expect( state.body[ 1 ].cells ).toEqual( [
			{
				align: 'left',
				content: '',
				tag: 'td',
			},
			{
				align: 'right',
				content: '',
				tag: 'td',
			},
		] );
	} );

	it( 'inherits align from the correct spanning source cell when the first row contains colspan', () => {
		const tableWithAlignmentAndColspan = {
			body: [
				{
					cells: [
						{
							align: 'left',
							content: 'A',
							tag: 'th',
						},
						{
							align: 'center',
							content: 'Grouped',
							tag: 'th',
							colspan: '2',
						},
						{
							align: 'right',
							content: 'D',
							tag: 'th',
						},
					],
				},
			],
		};

		const state = insertRow( tableWithAlignmentAndColspan, {
			sectionName: 'body',
			rowIndex: 1,
		} );

		expect( state.body[ 1 ].cells ).toEqual( [
			{
				align: 'left',
				content: '',
				tag: 'td',
			},
			{
				align: 'center',
				content: '',
				tag: 'td',
			},
			{
				align: 'center',
				content: '',
				tag: 'td',
			},
			{
				align: 'right',
				content: '',
				tag: 'td',
			},
		] );
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

	it( 'extends cells above that span across the inserted row and skips their columns', () => {
		const state = insertRow( tableWithRowspanHead, {
			sectionName: 'head',
			rowIndex: 1,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th', rowspan: '3' },
					{ content: 'B', tag: 'th', rowspan: '3' },
					{
						content: 'Grouped',
						tag: 'th',
						align: 'center',
						colspan: '2',
					},
					{ content: 'E', tag: 'th', rowspan: '3' },
				],
			},
			{
				cells: [
					{ content: '', tag: 'th', align: 'center' },
					{ content: '', tag: 'th', align: 'center' },
				],
			},
			{
				cells: [
					{ content: 'Sub C', tag: 'th' },
					{ content: 'Sub D', tag: 'th' },
				],
			},
		] );
	} );

	it( 'does not extend cells whose rowspan ends before the inserted row', () => {
		const state = insertRow( tableWithRowspanHead, {
			sectionName: 'head',
			rowIndex: 2,
		} );

		expect( state.head[ 0 ] ).toEqual( tableWithRowspanHead.head[ 0 ] );
		expect( state.head[ 2 ].cells ).toHaveLength( 5 );
	} );

	it( 'skips every column covered by a cell spanning both rows and columns', () => {
		const state = insertRow(
			deepFreeze( {
				body: [
					{
						cells: [
							{
								content: 'X',
								tag: 'td',
								colspan: '2',
								rowspan: '2',
							},
							{ content: 'Y', tag: 'td' },
						],
					},
					{ cells: [ { content: 'Z', tag: 'td' } ] },
				],
			} ),
			{ sectionName: 'body', rowIndex: 1 }
		);

		expect( state.body[ 0 ].cells[ 0 ].rowspan ).toBe( '3' );
		expect( state.body[ 1 ].cells ).toEqual( [
			{ content: '', tag: 'td' },
		] );
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

	it( 'widens a cell that spans across the inserted column', () => {
		const state = insertColumn( tableWithRowspanHead, {
			columnIndex: 3,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th', rowspan: '2' },
					{ content: 'B', tag: 'th', rowspan: '2' },
					{
						content: 'Grouped',
						tag: 'th',
						align: 'center',
						colspan: '3',
					},
					{ content: 'E', tag: 'th', rowspan: '2' },
				],
			},
			{
				cells: [
					{ content: 'Sub C', tag: 'th' },
					{ content: '', tag: 'th' },
					{ content: 'Sub D', tag: 'th' },
				],
			},
		] );
		expect( state.body[ 0 ].cells[ 3 ] ).toEqual( {
			content: '',
			tag: 'td',
		} );
	} );

	it( 'inserts cells at the logical column in rows covered by a rowspan', () => {
		const state = insertColumn( tableWithRowspanHead, {
			columnIndex: 2,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th', rowspan: '2' },
					{ content: 'B', tag: 'th', rowspan: '2' },
					{ content: '', tag: 'th' },
					{
						content: 'Grouped',
						tag: 'th',
						align: 'center',
						colspan: '2',
					},
					{ content: 'E', tag: 'th', rowspan: '2' },
				],
			},
			{
				cells: [
					{ content: '', tag: 'th' },
					{ content: 'Sub C', tag: 'th' },
					{ content: 'Sub D', tag: 'th' },
				],
			},
		] );
		expect( state.body[ 0 ].cells ).toHaveLength( 6 );
	} );

	it( 'does not add a cell to rows covered by a cell spanning across the inserted column', () => {
		const state = insertColumn(
			deepFreeze( {
				body: [
					{
						cells: [
							{
								content: 'X',
								tag: 'td',
								colspan: '2',
								rowspan: '2',
							},
							{ content: 'Y', tag: 'td' },
						],
					},
					{ cells: [ { content: 'Z', tag: 'td' } ] },
				],
			} ),
			{ columnIndex: 1 }
		);

		expect( state.body ).toEqual( [
			{
				cells: [
					{
						content: 'X',
						tag: 'td',
						colspan: '3',
						rowspan: '2',
					},
					{ content: 'Y', tag: 'td' },
				],
			},
			{ cells: [ { content: 'Z', tag: 'td' } ] },
		] );
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

	it( 'decrements the rowspan of cells above that span into the deleted row', () => {
		const state = deleteRow( tableWithRowspanHead, {
			sectionName: 'head',
			rowIndex: 1,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th' },
					{ content: 'B', tag: 'th' },
					{
						content: 'Grouped',
						tag: 'th',
						align: 'center',
						colspan: '2',
					},
					{ content: 'E', tag: 'th' },
				],
			},
		] );
	} );

	it( 'keeps the rowspan of cells above that still span multiple rows', () => {
		const state = deleteRow( tableWithTallRowspan, {
			sectionName: 'body',
			rowIndex: 1,
		} );

		expect( state.body ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'td', rowspan: '2' },
					{ content: 'B', tag: 'td' },
				],
			},
			{ cells: [ { content: 'D', tag: 'td' } ] },
		] );
	} );

	it( 'moves cells that span down from the deleted row to the next row', () => {
		const state = deleteRow( tableWithRowspanHead, {
			sectionName: 'head',
			rowIndex: 0,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th' },
					{ content: 'B', tag: 'th' },
					{ content: 'Sub C', tag: 'th' },
					{ content: 'Sub D', tag: 'th' },
					{ content: 'E', tag: 'th' },
				],
			},
		] );
	} );

	it( 'moves a cell to the next row with its remaining rowspan', () => {
		const state = deleteRow( tableWithTallRowspan, {
			sectionName: 'body',
			rowIndex: 0,
		} );

		expect( state.body ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'td', rowspan: '2' },
					{ content: 'C', tag: 'td' },
				],
			},
			{ cells: [ { content: 'D', tag: 'td' } ] },
		] );
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

	it( 'shrinks a cell that spans across the deleted column', () => {
		const state = deleteColumn( tableWithRowspanHead, {
			columnIndex: 3,
		} );

		expect( state.head ).toEqual( [
			{
				cells: [
					{ content: 'A', tag: 'th', rowspan: '2' },
					{ content: 'B', tag: 'th', rowspan: '2' },
					{ content: 'Grouped', tag: 'th', align: 'center' },
					{ content: 'E', tag: 'th', rowspan: '2' },
				],
			},
			{ cells: [ { content: 'Sub C', tag: 'th' } ] },
		] );
		expect(
			state.body[ 0 ].cells.map( ( { content } ) => content )
		).toEqual( [ 'A1', 'B1', 'C1', 'E1' ] );
	} );

	it( 'deletes cells by logical column in rows covered by a rowspan', () => {
		const state = deleteColumn( tableWithRowspanHead, {
			columnIndex: 2,
		} );

		// "Sub C" is the first cell of its row, but it is in column 2.
		expect( state.head[ 1 ] ).toEqual( {
			cells: [ { content: 'Sub D', tag: 'th' } ],
		} );
		expect(
			state.body[ 0 ].cells.map( ( { content } ) => content )
		).toEqual( [ 'A1', 'B1', 'D1', 'E1' ] );
	} );

	it( 'removes rows left empty and shrinks the cells spanning into them', () => {
		const state = deleteColumn(
			deepFreeze( {
				body: [
					{
						cells: [
							{ content: 'A', tag: 'td', rowspan: '2' },
							{ content: 'B', tag: 'td' },
						],
					},
					{ cells: [ { content: 'C', tag: 'td' } ] },
				],
			} ),
			{ columnIndex: 1 }
		);

		expect( state.body ).toEqual( [
			{ cells: [ { content: 'A', tag: 'td' } ] },
		] );
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

	it( 'uses the logical column count of the first body row when the row contains colspan', () => {
		const tableWithColspan = {
			head: [],
			body: [
				{
					cells: [
						{
							content: '',
							tag: 'td',
							colspan: '2',
						},
						{
							content: '',
							tag: 'td',
						},
					],
				},
			],
		};

		const state = toggleSection( tableWithColspan, 'head' );

		expect( state.head[ 0 ].cells ).toHaveLength( 3 );
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

	describe( 'with merged cells', () => {
		const markSelected = ( cell ) => ( { ...cell, selected: true } );
		const getSelectedContent = ( state ) =>
			[ 'head', 'body' ].flatMap( ( sectionName ) =>
				state[ sectionName ].flatMap( ( row ) =>
					row.cells
						.filter( ( cell ) => cell.selected )
						.map( ( cell ) => cell.content )
				)
			);

		it( 'selects cells by logical column in rows covered by a rowspan', () => {
			const state = updateSelectedCell(
				tableWithRowspanHead,
				{ type: 'column', columnIndex: 0 },
				markSelected
			);

			// "Sub C" is the first cell of its row, but it is in column 2.
			expect( getSelectedContent( state ) ).toEqual( [ 'A', 'A1' ] );
		} );

		it( 'selects cells spanning across the selected column', () => {
			const state = updateSelectedCell(
				tableWithRowspanHead,
				{ type: 'column', columnIndex: 3 },
				markSelected
			);

			expect( getSelectedContent( state ) ).toEqual( [
				'Grouped',
				'Sub D',
				'D1',
			] );
		} );

		it( 'selects every column covered by the selection', () => {
			const state = updateSelectedCell(
				tableWithRowspanHead,
				{ type: 'column', columnIndex: 2, colspan: 2 },
				markSelected
			);

			expect( getSelectedContent( state ) ).toEqual( [
				'Grouped',
				'Sub C',
				'Sub D',
				'C1',
				'D1',
			] );
		} );
	} );
} );
