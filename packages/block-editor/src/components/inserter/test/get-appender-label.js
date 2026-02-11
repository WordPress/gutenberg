/**
 * Internal dependencies
 */
import { getAppenderLabel } from '../get-appender-label';

describe( 'getAppenderLabel', () => {
	it( 'returns null when defaultBlock is null', () => {
		const result = getAppenderLabel( null, {} );
		expect( result ).toBeNull();
	} );

	it( 'returns null when defaultBlock.attributes is missing', () => {
		const defaultBlock = { name: 'core/test' };
		const defaultBlockType = {
			label: () => 'Add page',
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'returns null when defaultBlockType has no label callback', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = { name: 'core/test' };

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'calls label with correct arguments', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page', kind: 'post-type' },
		};
		const defaultBlockType = {
			label: jest.fn( () => 'Add page' ),
		};

		getAppenderLabel( defaultBlock, defaultBlockType );

		expect( defaultBlockType.label ).toHaveBeenCalledWith(
			{ type: 'page', kind: 'post-type' },
			{ context: 'appender' }
		);
	} );

	it( 'returns the label when it is a valid string', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			label: jest.fn( () => 'Add page' ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBe( 'Add page' );
	} );

	it( 'returns null when label returns null', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			label: jest.fn( () => null ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'returns null when label returns a non-string', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			label: jest.fn( () => 123 ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'returns null when label is 50 characters or more', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const longLabel = 'a'.repeat( 50 );
		const defaultBlockType = {
			label: jest.fn( () => longLabel ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'returns null when label is empty string', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			label: jest.fn( () => '' ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );
} );
