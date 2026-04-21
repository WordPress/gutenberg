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
		expect( getLabel( attributes, { context: 'list-view' } ) ).toBe(
			'My Custom Button'
		);
	} );

	it( 'returns text when no custom name is set', () => {
		const attributes = {
			text: 'My Custom Button',
		};
		expect( getLabel( attributes, { context: 'list-view' } ) ).toBe(
			'My Custom Button'
		);
	} );

	it( 'returns undefined when text is empty', () => {
		const attributes = {
			text: '',
		};
		expect(
			getLabel( attributes, { context: 'list-view' } )
		).toBeUndefined();
	} );

	it( 'returns undefined when empty attributes', () => {
		const attributes = {};
		expect(
			getLabel( attributes, { context: 'list-view' } )
		).toBeUndefined();
	} );

	it( 'returns undefined when context is not list-view', () => {
		const attributes = {
			text: 'Click me',
		};
		expect( getLabel( attributes, { context: 'other' } ) ).toBeUndefined();
	} );
} );
