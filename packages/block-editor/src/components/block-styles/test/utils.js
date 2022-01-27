/**
 * Internal dependencies
 */
import {
	getActiveStyle,
	getDefaultStyle,
	getRenderedStyles,
	replaceActiveStyle,
} from '../utils';

describe( 'getActiveStyle', () => {
	it( 'Should return the undefined if no active style', () => {
		const styles = [ { name: 'small' }, { name: 'big' } ];
		const className = 'custom-className';

		expect( getActiveStyle( styles, className ) ).toBeUndefined();
	} );

	it( 'Should return the default style if no active style', () => {
		const styles = [ { name: 'small' }, { name: 'big', isDefault: true } ];
		const className = 'custom-className';

		expect( getActiveStyle( styles, className ).name ).toBe( 'big' );
	} );

	it( 'Should return the active style', () => {
		const styles = [ { name: 'small' }, { name: 'big', isDefault: true } ];
		const className = 'this-is-custom is-style-small';

		expect( getActiveStyle( styles, className ).name ).toBe( 'small' );
	} );

	it( 'Should return the first active style', () => {
		const styles = [ { name: 'small' }, { name: 'big', isDefault: true } ];
		const className = 'this-is-custom is-style-small is-style-big';

		expect( getActiveStyle( styles, className ).name ).toBe( 'small' );
	} );
} );

describe( 'replaceActiveStyle', () => {
	it( 'Should add the new style if no active style', () => {
		const activeStyle = undefined;
		const newStyle = { name: 'small' };
		const className = 'custom-class';

		expect( replaceActiveStyle( className, activeStyle, newStyle ) ).toBe(
			'custom-class is-style-small'
		);
	} );

	it( 'Should add the new style if no active style (no existing class)', () => {
		const activeStyle = undefined;
		const newStyle = { name: 'small' };
		const className = '';

		expect( replaceActiveStyle( className, activeStyle, newStyle ) ).toBe(
			'is-style-small'
		);
	} );

	it( 'Should add the new style if no active style (unassigned default)', () => {
		const activeStyle = { name: 'default' };
		const newStyle = { name: 'small' };
		const className = '';

		expect( replaceActiveStyle( className, activeStyle, newStyle ) ).toBe(
			'is-style-small'
		);
	} );

	it( 'Should replace the previous active style', () => {
		const activeStyle = { name: 'large' };
		const newStyle = { name: 'small' };
		const className = 'custom-class is-style-large';

		expect( replaceActiveStyle( className, activeStyle, newStyle ) ).toBe(
			'custom-class is-style-small'
		);
	} );
} );

describe( 'getRenderedStyles', () => {
	it( 'Should return an empty array if styles is falsy', () => {
		expect( getRenderedStyles( null ) ).toEqual( [] );
	} );

	it( 'Should return an empty array if styles array is empty', () => {
		expect( getRenderedStyles( [] ) ).toEqual( [] );
	} );

	it( 'Should return styles collection if there is a default', () => {
		const styles = [
			{ name: 'hazlenut' },
			{ name: 'cashew', isDefault: true },
		];

		expect( getRenderedStyles( styles ) ).toEqual( styles );
	} );

	it( 'Should add a default item to the styles collection if there is no default', () => {
		const styles = [ { name: 'pistachio' }, { name: 'peanut' } ];
		const defaultStyle = {
			name: 'default',
			label: 'Default',
			isDefault: true,
		};

		expect( getRenderedStyles( styles ) ).toEqual( [
			defaultStyle,
			...styles,
		] );
	} );
} );

describe( 'getDefaultStyle', () => {
	it( 'Should return default style object', () => {
		const styles = [
			{ name: 'trout' },
			{ name: 'bream', isDefault: true },
		];

		expect( getDefaultStyle( styles ) ).toEqual( styles[ 1 ] );
	} );

	it( 'Should return `undefined` if there is no default', () => {
		const styles = [ { name: 'snapper' }, { name: 'perch' } ];

		expect( getDefaultStyle( styles ) ).toBeUndefined();
	} );

	it( 'Should return `undefined` if `styles` argument is no passed', () => {
		expect( getDefaultStyle() ).toBeUndefined();
	} );
} );
