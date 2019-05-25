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
	it( 'should insert column', () => {
		const state = insertColumn( tableWithContent, {
			section: 'body',
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
			section: 'head',
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
