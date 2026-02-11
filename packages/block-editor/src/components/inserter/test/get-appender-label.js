/**
 * Internal dependencies
 */
import { getAppenderLabel } from '../get-appender-label';

describe( 'getAppenderLabel', () => {
	it( 'should return null when defaultBlock is null', () => {
		const result = getAppenderLabel( null, {} );
		expect( result ).toBeNull();
	} );

	it( 'should return null when defaultBlock is undefined', () => {
		const result = getAppenderLabel( undefined, {} );
		expect( result ).toBeNull();
	} );

	it( 'should return null when defaultBlock.attributes is missing', () => {
		const defaultBlock = { name: 'core/test' };
		const defaultBlockType = {
			__experimentalLabel: jest.fn(),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
		expect( defaultBlockType.__experimentalLabel ).not.toHaveBeenCalled();
	} );

	it( 'should return null when defaultBlockType has no __experimentalLabel', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = { name: 'core/test' };

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return null when defaultBlockType is null', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};

		const result = getAppenderLabel( defaultBlock, null );

		expect( result ).toBeNull();
	} );

	it( 'should call __experimentalLabel with correct arguments', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page', kind: 'post-type' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => 'Add page' ),
		};

		getAppenderLabel( defaultBlock, defaultBlockType );

		expect( defaultBlockType.__experimentalLabel ).toHaveBeenCalledWith(
			{ type: 'page', kind: 'post-type' },
			{ context: 'appender' }
		);
	} );

	it( 'should return the label as-is without modification', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const fullLabel = 'Add page';
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => fullLabel ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBe( fullLabel );
	} );

	it( 'should return arbitrary label from __experimentalLabel regardless of attributes', () => {
		const defaultBlock = {
			name: 'core/custom',
			attributes: { foo: 'bar' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => 'This is a test' ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBe( 'This is a test' );
	} );

	it( 'should return null when __experimentalLabel returns null', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => null ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return null when __experimentalLabel returns undefined', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => undefined ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return null when __experimentalLabel returns a non-string', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => 123 ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return null when __experimentalLabel returns an object', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => ( { label: 'page' } ) ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return null when label is 50 characters or more', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const longLabel = 'a'.repeat( 50 );
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => longLabel ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	it( 'should return label when it is exactly 49 characters', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const label49chars = 'a'.repeat( 49 );
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => label49chars ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBe( label49chars );
	} );

	it( 'should return null when label is empty string', () => {
		const defaultBlock = {
			name: 'core/test',
			attributes: { type: 'page' },
		};
		const defaultBlockType = {
			__experimentalLabel: jest.fn( () => '' ),
		};

		const result = getAppenderLabel( defaultBlock, defaultBlockType );

		expect( result ).toBeNull();
	} );

	describe( 'Navigation Link block integration', () => {
		// Navigation Link returns the full label (e.g. "Add page") for appender context.
		const navigationLinkAppenderLabel = ( attributes, { context } ) => {
			if ( context === 'appender' ) {
				const type = attributes?.type || 'link';
				return `Add ${ type }`;
			}
			return attributes?.label;
		};

		it( 'should return "Add page" for Navigation Link page variation', () => {
			const defaultBlock = {
				name: 'core/navigation-link',
				attributes: {
					kind: 'post-type',
					type: 'page',
				},
			};
			const defaultBlockType = {
				__experimentalLabel: navigationLinkAppenderLabel,
			};

			const result = getAppenderLabel( defaultBlock, defaultBlockType );

			expect( result ).toBe( 'Add page' );
		} );

		it( 'should return "Add post" for Navigation Link post variation', () => {
			const defaultBlock = {
				name: 'core/navigation-link',
				attributes: {
					kind: 'post-type',
					type: 'post',
				},
			};
			const defaultBlockType = {
				__experimentalLabel: navigationLinkAppenderLabel,
			};

			const result = getAppenderLabel( defaultBlock, defaultBlockType );

			expect( result ).toBe( 'Add post' );
		} );

		it( 'should return "Add category" for Navigation Link category variation', () => {
			const defaultBlock = {
				name: 'core/navigation-link',
				attributes: {
					kind: 'taxonomy',
					type: 'category',
				},
			};
			const defaultBlockType = {
				__experimentalLabel: navigationLinkAppenderLabel,
			};

			const result = getAppenderLabel( defaultBlock, defaultBlockType );

			expect( result ).toBe( 'Add category' );
		} );
	} );
} );
