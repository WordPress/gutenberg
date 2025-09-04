/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Inserter from '../index';

// We need to test the defaultRenderToggle function, but it's not exported
// So we'll test it through the Inserter component by not providing a custom renderToggle

describe( 'Inserter defaultRenderToggle', () => {
	// Mock the InserterMenu and QuickInserter to avoid complex dependencies
	jest.mock( '../menu', () => {
		return function MockInserterMenu() {
			return <div data-testid="mock-inserter-menu" />;
		};
	} );

	jest.mock( '../quick-inserter', () => {
		return function MockQuickInserter() {
			return <div data-testid="mock-quick-inserter" />;
		};
	} );

	// Mock the store selectors
	const mockSelect = jest.fn();
	jest.mock( '@wordpress/data', () => ( {
		useSelect: () => mockSelect(),
		withSelect: () => ( Component ) => Component,
		withDispatch: () => ( Component ) => Component,
	} ) );

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Appender Label Functionality', () => {
		it( 'should show "Add block" when no defaultBlock is provided', () => {
			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: null,
				defaultBlockType: null,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			// The defaultRenderToggle should render a button with "Add block" label
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add block' );
		} );

		it( 'should show "Add {blockTitle}" when hasSingleBlockType is true', () => {
			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: true,
				blockTitle: 'Paragraph',
				allowedBlockType: {
					name: 'core/paragraph',
					title: 'Paragraph',
				},
				directInsertBlock: null,
				defaultBlockType: null,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			// The defaultRenderToggle should render a button with "Add paragraph" label (lowercase)
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add paragraph' );
		} );

		it( 'should show appender label when defaultBlock has __experimentalLabel with appender context', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn( ( attributes, { context } ) => {
					if ( context === 'appender' ) {
						return attributes.type || 'item';
					}
					return 'Test Block';
				} ),
			};

			const defaultBlock = {
				name: 'core/test-block',
				attributes: {
					type: 'page',
				},
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			expect( mockBlockType.__experimentalLabel ).toHaveBeenCalledWith(
				{ type: 'page' },
				{ context: 'appender' }
			);

			// The defaultRenderToggle should render a button with "Add page" label
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add page' );
		} );

		it( 'should convert appender label to lowercase', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn( ( attributes, { context } ) => {
					if ( context === 'appender' ) {
						return 'PAGE'; // Return uppercase
					}
					return 'Test Block';
				} ),
			};

			const defaultBlock = {
				name: 'core/test-block',
				attributes: {
					type: 'page',
				},
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			expect( mockBlockType.__experimentalLabel ).toHaveBeenCalledWith(
				{ type: 'page' },
				{ context: 'appender' }
			);

			// The label should be "Add page" (lowercase)
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add page' );
		} );

		it( 'should fall back to "Add block" when __experimentalLabel returns invalid result', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn( ( attributes, { context } ) => {
					if ( context === 'appender' ) {
						return null; // Return invalid result
					}
					return 'Test Block';
				} ),
			};

			const defaultBlock = {
				name: 'core/test-block',
				attributes: {
					type: 'page',
				},
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			expect( mockBlockType.__experimentalLabel ).toHaveBeenCalledWith(
				{ type: 'page' },
				{ context: 'appender' }
			);

			// Should fall back to "Add block"
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add block' );
		} );

		it( 'should reject appender labels longer than 50 characters', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn( ( attributes, { context } ) => {
					if ( context === 'appender' ) {
						return 'This is a very long appender label that exceeds the maximum length limit of fifty characters';
					}
					return 'Test Block';
				} ),
			};

			const defaultBlock = {
				name: 'core/test-block',
				attributes: {
					type: 'page',
				},
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			expect( mockBlockType.__experimentalLabel ).toHaveBeenCalledWith(
				{ type: 'page' },
				{ context: 'appender' }
			);

			// Should fall back to "Add block" due to length limit
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add block' );
		} );

		it( 'should handle missing defaultBlock.attributes gracefully', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn(),
			};

			const defaultBlock = {
				name: 'core/test-block',
				// Missing attributes property
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: false,
				blockTitle: '',
				allowedBlockType: null,
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			// Should not call __experimentalLabel when attributes are missing
			expect( mockBlockType.__experimentalLabel ).not.toHaveBeenCalled();

			// Should fall back to "Add block"
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add block' );
		} );

		it( 'should prioritize single block type over appender label', () => {
			const mockBlockType = {
				name: 'core/test-block',
				title: 'Test Block',
				__experimentalLabel: jest.fn( ( attributes, { context } ) => {
					if ( context === 'appender' ) {
						return 'page';
					}
					return 'Test Block';
				} ),
			};

			const defaultBlock = {
				name: 'core/test-block',
				attributes: {
					type: 'page',
				},
			};

			mockSelect.mockReturnValue( {
				hasItems: true,
				hasSingleBlockType: true,
				blockTitle: 'Paragraph',
				allowedBlockType: {
					name: 'core/paragraph',
					title: 'Paragraph',
				},
				directInsertBlock: defaultBlock,
				defaultBlockType: mockBlockType,
				rootClientId: 'test-client-id',
			} );

			render( <Inserter rootClientId="test-client-id" /> );

			// Should not call __experimentalLabel when hasSingleBlockType is true
			expect( mockBlockType.__experimentalLabel ).not.toHaveBeenCalled();

			// Should show "Add paragraph" (single block type takes priority)
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveTextContent( 'Add paragraph' );
		} );
	} );
} );
