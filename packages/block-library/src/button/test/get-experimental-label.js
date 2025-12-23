/**
 * Internal dependencies
 */
import { settings } from '..';

describe( 'Button block __experimentalLabel', () => {
	const { __experimentalLabel: getLabel } = settings;

	it( 'returns custom name when metadata.name exists', () => {
		const attributes = {
			metadata: { name: 'My Custom Button' },
			text: 'Click me',
		};
		expect( getLabel( attributes ) ).toBe( 'My Custom Button' );
	} );

	it( 'returns text when no custom name is set', () => {
		const attributes = {
			text: 'My Custom Button',
		};
		expect( getLabel( attributes ) ).toBe( 'My Custom Button' );
	} );

	it( 'returns "Button" when text is empty', () => {
		const attributes = {
			text: '',
		};
		expect( getLabel( attributes ) ).toBe( 'Button' );
	} );

	it( 'returns "Button" when text is undefined', () => {
		const attributes = {};
		expect( getLabel( attributes ) ).toBe( 'Button' );
	} );
} );
