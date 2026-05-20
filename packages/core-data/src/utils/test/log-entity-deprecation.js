/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import logEntityDeprecation from '../log-entity-deprecation';

jest.useFakeTimers();

// Mock the deprecatedEntities import
jest.mock( '../../entities', () => ( {
	deprecatedEntities: {
		root: {
			media: {
				since: '6.9',
				alternative: {
					kind: 'postType',
					name: 'attachment',
				},
			},
		},
	},
} ) );

// Mock the deprecated function
jest.mock( '@wordpress/deprecated' );

describe( 'logEntityDeprecation', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Ensure the timeout that prevents spurious logging is cleared.
		jest.runAllTimers();
	} );

	it( 'should call deprecated when entity is deprecated', () => {
		logEntityDeprecation( 'root', 'media', 'getEntityRecord' );

		expect( deprecated ).toHaveBeenCalledWith(
			"The 'root', 'media' entity (used via 'getEntityRecord')",
			{
				since: '6.9',
				alternative: "the 'postType', 'attachment' entity",
			}
		);
	} );

	it( 'should not call deprecated when entity is not deprecated', () => {
		logEntityDeprecation( 'root', 'nonExistentEntity', 'getEntityRecord' );

		expect( deprecated ).not.toHaveBeenCalled();
	} );

	it( 'should not call deprecated when kind is not deprecated', () => {
		logEntityDeprecation( 'nonExistentKind', 'media', 'getEntityRecord' );

		expect( deprecated ).not.toHaveBeenCalled();
	} );

	it( 'should handle different function names', () => {
		logEntityDeprecation( 'root', 'media', 'saveEntityRecord' );

		expect( deprecated ).toHaveBeenCalledWith(
			"The 'root', 'media' entity (used via 'saveEntityRecord')",
			{
				since: '6.9',
				alternative: "the 'postType', 'attachment' entity",
			}
		);
	} );

	it( 'should include alternative function name when provided', () => {
		logEntityDeprecation( 'root', 'media', 'getEntityRecord', {
			alternativeFunctionName: 'getPostTypeEntity',
		} );

		expect( deprecated ).toHaveBeenCalledWith(
			"The 'root', 'media' entity (used via 'getEntityRecord')",
			{
				since: '6.9',
				alternative:
					"the 'postType', 'attachment' entity via the 'getPostTypeEntity' function",
			}
		);
	} );

	it( 'should handle isShorthandSelector', () => {
		logEntityDeprecation( 'root', 'media', 'getMedia', {
			isShorthandSelector: true,
		} );

		expect( deprecated ).toHaveBeenCalledWith( "'getMedia'", {
			since: '6.9',
			alternative: "the 'postType', 'attachment' entity",
		} );
	} );

	it( 'should handle empty string parameters', () => {
		logEntityDeprecation( '', '', '' );

		expect( deprecated ).not.toHaveBeenCalled();
	} );

	it( 'should handle null parameters', () => {
		logEntityDeprecation( null, null, null );

		expect( deprecated ).not.toHaveBeenCalled();
	} );

	it( 'should handle undefined parameters', () => {
		logEntityDeprecation( undefined, undefined, undefined );

		expect( deprecated ).not.toHaveBeenCalled();
	} );

	it( 'should handle undefined options', () => {
		logEntityDeprecation( 'root', 'media', 'getEntityRecord', undefined );

		expect( deprecated ).toHaveBeenCalledWith(
			"The 'root', 'media' entity (used via 'getEntityRecord')",
			{
				since: '6.9',
				alternative: "the 'postType', 'attachment' entity",
			}
		);
	} );
} );
