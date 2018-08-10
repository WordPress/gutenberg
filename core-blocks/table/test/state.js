import {
	createTable,
	updateCellContent,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
} from '../state';

const table = {
	body: [
		{
			cells: [
				{
					content: [],
					tag: 'td',
				},
				{
					content: [],
					tag: 'td',
				},
			],
		},
		{
			cells: [
				{
					content: [],
					tag: 'td',
				},
				{
					content: [],
					tag: 'td',
				},
			],
		},
	],
};

const tableWithContent = {
	body: [
		{
			cells: [
				{
					content: [],
					tag: 'td',
				},
				{
					content: [],
					tag: 'td',
				},
			],
		},
		{
			cells: [
				{
					content: [],
					tag: 'td',
				},
				{
					content: [ 'test' ],
					tag: 'td',
				},
			],
		},
	],
};

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
			content: [ 'test' ],
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
							content: [],
							tag: 'td',
						},
						{
							content: [],
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: [],
							tag: 'td',
						},
						{
							content: [ 'test' ],
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: [],
							tag: 'td',
						},
						{
							content: [],
							tag: 'td',
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
							content: [],
							tag: 'td',
						},
						{
							content: [],
							tag: 'td',
						},
						{
							content: [],
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: [],
							tag: 'td',
						},
						{
							content: [ 'test' ],
							tag: 'td',
						},
						{
							content: [],
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
							content: [],
							tag: 'td',
						},
						{
							content: [ 'test' ],
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
							content: [],
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: [ 'test' ],
							tag: 'td',
						},
					],
				},
			],
		};

		expect( state ).toEqual( expected );
	} );
} );
