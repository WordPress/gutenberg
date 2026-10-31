/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { downloadBlob } from '@wordpress/blob';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { importContentGuidelines, exportContentGuidelines } from '../api';
import type { Categories } from '../types';

// Mock dependencies
jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/blob' );
jest.mock( '@wordpress/data' );
jest.mock( '@wordpress/notices' );

const mockApiFetch = jest.mocked( apiFetch );

describe( 'Content Guidelines API - Import/Export', () => {
	let mockDispatch: any;
	let mockSelect: any;

	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock dispatch
		mockDispatch = {
			setGuideline: jest.fn(),
			setBlockGuideline: jest.fn(),
			setFromResponse: jest.fn(),
		};

		// Setup mock select
		mockSelect = {
			getAllGuidelines: jest.fn(),
			getBlockGuidelines: jest.fn(),
			getId: jest.fn(),
			getStatus: jest.fn(),
		};

		( dispatch as jest.Mock ).mockImplementation( ( store ) => {
			if ( store === noticesStore ) {
				return { createSuccessNotice: jest.fn() };
			}
			return mockDispatch;
		} );
		( select as jest.Mock ).mockReturnValue( mockSelect );
	} );

	describe( 'Import', () => {
		test( 'should import valid JSON file with all categories', async () => {
			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'Site guidelines' },
					copy: { guidelines: 'Copy guidelines' },
					images: { guidelines: 'Image guidelines' },
					additional: { guidelines: 'Additional guidelines' },
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json',
				{ type: 'application/json' }
			);

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockResolvedValue( {
				id: 1,
				status: 'draft',
			} );

			await importContentGuidelines( file );

			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'site',
				'Site guidelines'
			);
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'copy',
				'Copy guidelines'
			);
		} );

		test( 'should import block guidelines', async () => {
			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'Site' },
					copy: { guidelines: 'Copy' },
					images: { guidelines: 'Images' },
					additional: { guidelines: 'Additional' },
					blocks: {
						'core/paragraph': {
							guidelines: 'Paragraph guidelines',
						},
						'core/heading': { guidelines: 'Heading guidelines' },
					},
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json'
			);

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockResolvedValue( { id: 1 } );

			await importContentGuidelines( file );

			expect( mockDispatch.setBlockGuideline ).toHaveBeenCalledWith(
				'core/paragraph',
				'Paragraph guidelines'
			);
			expect( mockDispatch.setBlockGuideline ).toHaveBeenCalledWith(
				'core/heading',
				'Heading guidelines'
			);
		} );

		test( 'should reject invalid JSON', async () => {
			const file = new File( [ 'not valid json' ], 'guidelines.json' );

			await expect( importContentGuidelines( file ) ).rejects.toThrow();
		} );

		test( 'should reject file without guideline_categories', async () => {
			const file = new File(
				[ JSON.stringify( { some: 'data' } ) ],
				'guidelines.json'
			);

			await expect( importContentGuidelines( file ) ).rejects.toThrow();
		} );

		test( 'should reject file with empty guideline_categories', async () => {
			const file = new File(
				[ JSON.stringify( { guideline_categories: null } ) ],
				'guidelines.json'
			);

			await expect( importContentGuidelines( file ) ).rejects.toThrow();
		} );

		test( 'should rollback on save failure', async () => {
			const originalGuidelines: Categories = {
				site: 'Original site',
				copy: 'Original copy',
				images: 'Original images',
				additional: 'Original additional',
				blocks: {},
			};

			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'New site' },
					copy: { guidelines: 'New copy' },
					images: { guidelines: 'New images' },
					additional: { guidelines: 'New additional' },
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json'
			);

			mockSelect.getAllGuidelines.mockReturnValue( originalGuidelines );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockRejectedValue( new Error( 'Save failed' ) );

			await expect( importContentGuidelines( file ) ).rejects.toThrow(
				'Save failed'
			);

			// Verify rollback was called
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'site',
				'Original site'
			);
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'copy',
				'Original copy'
			);
		} );

		test( 'should rollback block guidelines on save failure', async () => {
			const originalBlocks = {
				'core/paragraph': 'Original paragraph',
				'core/heading': 'Original heading',
			};

			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'Site' },
					copy: { guidelines: 'Copy' },
					images: { guidelines: 'Images' },
					additional: { guidelines: 'Additional' },
					blocks: {
						'core/paragraph': { guidelines: 'New paragraph' },
					},
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json'
			);

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( originalBlocks );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockRejectedValue( new Error( 'Save failed' ) );

			await expect( importContentGuidelines( file ) ).rejects.toThrow();

			// Verify rollback for block guidelines
			expect( mockDispatch.setBlockGuideline ).toHaveBeenCalledWith(
				'core/paragraph',
				'Original paragraph'
			);
			expect( mockDispatch.setBlockGuideline ).toHaveBeenCalledWith(
				'core/heading',
				'Original heading'
			);
		} );

		test( 'should import partial categories', async () => {
			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'Site guidelines' },
					// missing copy, images, additional
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json'
			);

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: 'Existing copy',
				images: 'Existing images',
				additional: 'Existing additional',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockResolvedValue( { id: 1 } );

			await importContentGuidelines( file );

			// Should update only site
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'site',
				'Site guidelines'
			);
		} );

		test( 'should ignore non-string guidelines', async () => {
			const fileContent = {
				guideline_categories: {
					site: { guidelines: 'Site' },
					// Invalid structures
					copy: { guidelines: 123 },
					images: { guidelines: null },
					additional: { guidelines: {} },
				},
			};

			const file = new File(
				[ JSON.stringify( fileContent ) ],
				'guidelines.json'
			);

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			mockApiFetch.mockResolvedValue( { id: 1 } );

			await importContentGuidelines( file );

			// Only site should be imported
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'site',
				'Site'
			);
			expect( mockDispatch.setGuideline ).not.toHaveBeenCalledWith(
				'copy',
				expect.anything()
			);
		} );
	} );

	describe( 'Export', () => {
		test( 'should export all categories', () => {
			const guidelines: Categories = {
				site: 'Site guidelines',
				copy: 'Copy guidelines',
				images: 'Image guidelines',
				additional: 'Additional guidelines',
				blocks: {
					'core/paragraph': 'Paragraph guidelines',
					'core/heading': 'Heading guidelines',
				},
			};

			mockSelect.getAllGuidelines.mockReturnValue( guidelines );
			mockSelect.getBlockGuidelines.mockReturnValue( guidelines.blocks );

			exportContentGuidelines();

			expect( downloadBlob ).toHaveBeenCalled();
			const [ filename, content ] = ( downloadBlob as jest.Mock ).mock
				.calls[ 0 ];

			expect( filename ).toBe( 'guidelines.json' );

			const exported = JSON.parse( content );
			expect( exported.guideline_categories.site.guidelines ).toBe(
				'Site guidelines'
			);
			expect( exported.guideline_categories.copy.guidelines ).toBe(
				'Copy guidelines'
			);

			// tests blocks.
			expect(
				exported.guideline_categories.blocks[ 'core/paragraph' ]
					.guidelines
			).toBe( 'Paragraph guidelines' );
			expect(
				exported.guideline_categories.blocks[ 'core/heading' ]
					.guidelines
			).toBe( 'Heading guidelines' );
		} );

		test( 'should export empty guidelines as empty strings', () => {
			const guidelines: Categories = {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			};

			mockSelect.getAllGuidelines.mockReturnValue( guidelines );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );

			exportContentGuidelines();

			const [ , content ] = ( downloadBlob as jest.Mock ).mock.calls[ 0 ];
			const exported = JSON.parse( content );

			expect( exported.guideline_categories.site.guidelines ).toBe( '' );
			expect( exported.guideline_categories.copy.guidelines ).toBe( '' );
		} );

		test( 'should export content guidelines with correct MIME type and JSON structure', () => {
			mockSelect.getAllGuidelines.mockReturnValue( {
				site: 'Site guidelines',
				copy: 'Copy guidelines',
				images: 'Image guidelines',
				additional: 'Additional guidelines',
				blocks: {
					'core/paragraph': 'Paragraph guidelines',
				},
			} );

			mockSelect.getBlockGuidelines.mockReturnValue( {
				'core/paragraph': 'Paragraph guidelines',
			} );

			exportContentGuidelines();

			const [ , content, mimeType ] = ( downloadBlob as jest.Mock ).mock
				.calls[ 0 ];

			// MIME type check
			expect( mimeType ).toBe( 'application/json' );

			// Should be valid JSON
			expect( () => JSON.parse( content ) ).not.toThrow();

			// Should have proper structure
			const exported = JSON.parse( content );
			expect( exported ).toHaveProperty( 'guideline_categories' );
			expect( exported.guideline_categories ).toHaveProperty( 'site' );
			expect( exported.guideline_categories ).toHaveProperty( 'blocks' );
		} );
	} );

	describe( 'Import-Export roundtrip', () => {
		test( 'should allow re-importing exported data', async () => {
			// Export
			const originalGuidelines: Categories = {
				site: 'Site guidelines',
				copy: 'Copy guidelines',
				images: 'Image guidelines',
				additional: 'Additional guidelines',
				blocks: {
					'core/paragraph': 'Paragraph guidelines',
				},
			};

			mockSelect.getAllGuidelines.mockReturnValue( originalGuidelines );
			mockSelect.getBlockGuidelines.mockReturnValue(
				originalGuidelines.blocks
			);

			exportContentGuidelines();

			const [ , exportedContent ] = ( downloadBlob as jest.Mock ).mock
				.calls[ 0 ];

			// Import the exported data
			const file = new File( [ exportedContent ], 'guidelines.json' );

			mockSelect.getAllGuidelines.mockReturnValue( {
				site: '',
				copy: '',
				images: '',
				additional: '',
				blocks: {},
			} );
			mockSelect.getBlockGuidelines.mockReturnValue( {} );
			mockSelect.getId.mockReturnValue( null );
			mockSelect.getStatus.mockReturnValue( 'draft' );

			( apiFetch as unknown as jest.Mock ).mockResolvedValue( { id: 1 } );

			await importContentGuidelines( file );

			// Verify all data was imported correctly
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'site',
				'Site guidelines'
			);
			expect( mockDispatch.setGuideline ).toHaveBeenCalledWith(
				'copy',
				'Copy guidelines'
			);
			expect( mockDispatch.setBlockGuideline ).toHaveBeenCalledWith(
				'core/paragraph',
				'Paragraph guidelines'
			);
		} );
	} );
} );
