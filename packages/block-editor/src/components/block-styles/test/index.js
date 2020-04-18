/**
 * Internal dependencies
 */
import { getActiveStyles, removeStyle, addStyle } from '../';

describe( 'getActiveStyles', () => {
	it( 'Should return empty array if no active styles', () => {
		const styles = [ { name: 'small' }, { name: 'big' } ];
		const className = 'custom-className';

		expect( getActiveStyles( styles, className ) ).toEqual( [] );
	} );

	it( 'Should return the default style if no active style', () => {
		const styles = [ { name: 'small' }, { name: 'big', isDefault: true } ];
		const className = 'custom-className';

		expect( getActiveStyles( styles, className ) ).toEqual( [
			{ name: 'big', isDefault: true },
		] );
	} );

	it( 'Should return all active styles', () => {
		const styles = [ { name: 'small' }, { name: 'big', isDefault: true } ];
		const className = 'this-is-custom is-style-small is-style-big';

		expect(
			getActiveStyles( styles, className ).map( ( s ) => s.name )
		).toEqual( [ 'small', 'big' ] );
	} );
} );

describe( 'addStyle', () => {
	it( 'Should add the new style if no active styles', () => {
		const style = { name: 'small' };
		const className = 'custom-class';

		expect( addStyle( className, style ) ).toBe(
			'custom-class is-style-small'
		);
	} );

	it( 'Should add the new style if no active style or class', () => {
		const style = { name: 'small' };
		const className = '';

		expect( addStyle( className, style ) ).toBe( 'is-style-small' );
	} );

	it( 'Should not add the new style if it is already active', () => {
		const style = { name: 'small' };
		const className = 'custom-class is-style-small';

		expect( addStyle( className, style ) ).toBe(
			'custom-class is-style-small'
		);
	} );
} );

describe( 'removeStyle', () => {
	it( 'Should remove the style if it is an active style', () => {
		const style = { name: 'small' };
		const className = 'custom-class is-style-small';

		expect( removeStyle( className, style ) ).toBe( 'custom-class' );
	} );

	it( "Should not do anything if the style isn't active", () => {
		const style = { name: 'small' };
		const className = '';

		expect( removeStyle( className, style ) ).toBe( '' );
	} );

	it( 'Should remove the style if it is defined multiple times', () => {
		const style = { name: 'small' };
		const className =
			'is-style-small custom-class is-style-small is-style-small';

		expect( removeStyle( className, style ) ).toBe( 'custom-class' );
	} );
} );
