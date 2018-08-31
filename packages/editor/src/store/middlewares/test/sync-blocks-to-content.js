/**
 * Internal dependencies
 */
import * as selectors from '../../selectors';
import { isForcedParse, isSkippedParse, getPostContent } from '../sync-blocks-to-content';

jest.mock( '../../selectors', () => ( {
	getPostEdits: jest.fn(),
	getCurrentPostAttribute: jest.fn(),
} ) );

describe( 'syncBlocksToContent', () => {
	beforeEach( () => {
		selectors.getPostEdits.mockReset();
		selectors.getCurrentPostAttribute.mockReset();
	} );

	describe( 'isForcedParse', () => {
		it( 'should return false if there are no action options', () => {
			const result = isForcedParse( {} );

			expect( result ).toBe( false );
		} );

		it( 'should return false if there is no skip flag', () => {
			const result = isForcedParse( { options: {} } );

			expect( result ).toBe( false );
		} );

		it( 'should return false if skip flag is present and not false', () => {
			const result = isForcedParse( {
				options: { skipContentParse: true },
			} );

			expect( result ).toBe( false );
		} );

		it( 'should return true if skip flag is present and explicitly false', () => {
			const result = isForcedParse( {
				options: { skipContentParse: false },
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'isSkippedParse', () => {
		it( 'should return false if there are no action options', () => {
			const result = isForcedParse( {} );

			expect( result ).toBe( false );
		} );

		it( 'should return false if there is no skip flag', () => {
			const result = isForcedParse( { options: {} } );

			expect( result ).toBe( false );
		} );

		it( 'should return false if skip flag is present and false', () => {
			const result = isSkippedParse( {
				options: { skipContentParse: false },
			} );

			expect( result ).toBe( false );
		} );

		it( 'should return true if skip flag is present and true', () => {
			const result = isSkippedParse( {
				options: { skipContentParse: true },
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'getPostContent', () => {
		it( 'should prefer the edited content', () => {
			selectors.getPostEdits.mockReturnValue( { content: '' } );
			selectors.getCurrentPostAttribute.mockImplementation( ( state, attribute ) => {
				return attribute === 'content' ? 'bar' : '__unexpected__';
			} );

			const state = {};

			const content = getPostContent( state );

			expect( content ).toBe( '' );
		} );

		it( 'should fall back to using persisted post content', () => {
			selectors.getPostEdits.mockReturnValue( {} );
			selectors.getCurrentPostAttribute.mockImplementation( ( state, attribute ) => {
				return attribute === 'content' ? 'bar' : '__unexpected__';
			} );

			const state = {};

			const content = getPostContent( state );

			expect( content ).toBe( 'bar' );
		} );
	} );
} );
