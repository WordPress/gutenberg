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
	getStyleValue,
	getStyleUnit,
	getTableStyles,
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

describe( 'getStyleValue', () => {
	it( 'returns 50 for a style value with the numerical value of 50', () => {
		expect( getStyleValue( '50%' ) ).toBe( 50 );
		expect( getStyleValue( '50px' ) ).toBe( 50 );
		expect( getStyleValue( 50 ) ).toBe( 50 );
	} );

	it( 'returns undefined when unable to find a numerical value', () => {
		expect( getStyleValue() ).toBeUndefined();
		expect( getStyleValue( '' ) ).toBeUndefined();
		expect( getStyleValue( 'px' ) ).toBeUndefined();
		expect( getStyleValue( null ) ).toBeUndefined();
	} );
} );

describe( 'getStyleUnit', () => {
	it( 'returns % for a style value with the % suffix', () => {
		expect( getStyleUnit( '50%' ) ).toBe( '%' );
	} );

	it( 'returns px for a style value with the px suffix', () => {
		expect( getStyleUnit( '50px' ) ).toBe( 'px' );
	} );

	it( 'returns px for a style value with the PX suffix (case insensitivity)', () => {
		expect( getStyleUnit( '50PX' ) ).toBe( 'px' );
	} );

	it( 'returns undefined when unable to find a px or % value', () => {
		expect( getStyleUnit( '50' ) ).toBeUndefined();
		expect( getStyleUnit( '' ) ).toBeUndefined();
		expect( getStyleUnit( 50 ) ).toBeUndefined();
		expect( getStyleUnit( null ) ).toBeUndefined();
		expect( getStyleUnit() ).toBeUndefined();
	} );
} );

describe( 'getTableStyles', () => {
	it( 'returns undefined when height and width are falsey values', () => {
		expect( getTableStyles( {} ) ).toBeUndefined();
		expect( getTableStyles( { width: '', height: '' } ) ).toBeUndefined();
	} );

	it( 'returns the width and height attributes in an object when defined', () => {
		const attributes = { width: '50%', height: '200px', somethingElse: 'ignored' };
		expect( getTableStyles( attributes ) ).toEqual( { width: '50%', height: '200px' } );
	} );
} );
