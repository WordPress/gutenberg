/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useMigrateFootnotes } from '../use-migrate-footnotes';

describe( 'useMigrateFootnotes', () => {
	let mockSetAttributes;

	beforeEach( () => {
		mockSetAttributes = jest.fn();
		jest.clearAllMocks();
	} );

	describe( 'when footnotes are already in block attributes', () => {
		it( 'should return footnotes from attributes', () => {
			const attributes = {
				footnotes: [
					{ id: '1', content: 'First footnote' },
					{ id: '2', content: 'Second footnote' },
				],
			};
			const meta = {};

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( attributes.footnotes );
			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should not migrate when attributes already have footnotes', () => {
			const attributes = {
				footnotes: [ { id: '1', content: 'Existing' } ],
			};
			const meta = {
				footnotes: JSON.stringify( [
					{ id: '1', content: 'From meta' },
				] ),
			};

			renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when footnotes need migration from meta', () => {
		it( 'should return footnotes from meta before migration completes', () => {
			const attributes = {};
			const footnotesFromMeta = [
				{ id: '1', content: 'First footnote' },
				{ id: '2', content: 'Second footnote' },
			];
			const meta = {
				footnotes: JSON.stringify( footnotesFromMeta ),
			};

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( footnotesFromMeta );
		} );

		it( 'should migrate footnotes from meta to attributes', () => {
			const attributes = {};
			const footnotesFromMeta = [
				{ id: '1', content: 'First footnote' },
				{ id: '2', content: 'Second footnote' },
			];
			const meta = {
				footnotes: JSON.stringify( footnotesFromMeta ),
			};

			renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( mockSetAttributes ).toHaveBeenCalledTimes( 1 );
			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				footnotes: footnotesFromMeta,
			} );
		} );

		it( 'should only migrate once even if hook re-renders', () => {
			const attributes = {};
			const footnotesFromMeta = [
				{ id: '1', content: 'First footnote' },
			];
			const meta = {
				footnotes: JSON.stringify( footnotesFromMeta ),
			};

			const { rerender } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( mockSetAttributes ).toHaveBeenCalledTimes( 1 );

			rerender();

			expect( mockSetAttributes ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'when footnotes are not supported', () => {
		it( 'should return empty array when meta.footnotes is not a string', () => {
			const attributes = {};
			const meta = {
				footnotes: [ { id: '1', content: 'Not a string' } ],
			};

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should return empty array when meta.footnotes is undefined', () => {
			const attributes = {};
			const meta = {};

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when meta contains invalid JSON', () => {
		it( 'should return empty array', () => {
			const attributes = {};
			const meta = { footnotes: 'invalid json {' };

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when meta contains empty array', () => {
		it( 'should return empty array and not migrate', () => {
			const attributes = {};
			const meta = { footnotes: JSON.stringify( [] ) };

			const { result } = renderHook( () =>
				useMigrateFootnotes( attributes, mockSetAttributes, meta )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSetAttributes ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'migration flow', () => {
		it( 'should return meta footnotes initially, then attributes after migration', () => {
			const footnotesFromMeta = [
				{ id: '1', content: 'First footnote' },
			];
			const meta = {
				footnotes: JSON.stringify( footnotesFromMeta ),
			};

			const { result, rerender } = renderHook(
				( props ) =>
					useMigrateFootnotes(
						props.attributes,
						mockSetAttributes,
						props.meta
					),
				{
					initialProps: {
						attributes: {},
						meta,
					},
				}
			);

			// Should return from meta initially.
			expect( result.current ).toEqual( footnotesFromMeta );
			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				footnotes: footnotesFromMeta,
			} );

			// Simulate attributes being updated after migration.
			rerender( {
				attributes: { footnotes: footnotesFromMeta },
				meta,
			} );

			// Should now return from attributes.
			expect( result.current ).toEqual( footnotesFromMeta );
		} );
	} );
} );
