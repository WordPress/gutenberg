/**
 * Internal dependencies
 */
import {
	getActiveStyle,
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
			label: 'default',
			isDefault: true,
		};

		expect( getRenderedStyles( styles ) ).toEqual( [
			defaultStyle,
			...styles,
		] );
	} );

	it( 'Should sort by `defaultStyleId` where passed', () => {
		const styles = [
			{ name: 'macadamia' },
			{ name: 'brazil' },
			{ name: 'almond', isDefault: true },
		];

		expect( getRenderedStyles( styles, 'brazil' ) ).toEqual( [
			{ name: 'brazil' },
			{ name: 'macadamia' },
			{ name: 'almond', isDefault: true },
		] );
	} );
} );
