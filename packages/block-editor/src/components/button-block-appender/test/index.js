/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from '../index';

// Mock the Inserter component
jest.mock( '../../inserter', () => {
	return function MockInserter( { renderToggle, ...props } ) {
		const mockToggleProps = {
			onToggle: jest.fn(),
			disabled: false,
			isOpen: false,
			blockTitle: 'Test Block',
			hasSingleBlockType: false,
			defaultBlock: null,
			defaultBlockType: null,
			...props,
		};

		return renderToggle ? (
			renderToggle( mockToggleProps )
		) : (
			<div data-testid="mock-inserter" />
		);
	};
} );

describe( 'ButtonBlockAppender', () => {
	beforeEach( () => {
		// Clear any registered blocks
		jest.clearAllMocks();
	} );

	describe( 'Appender Label Functionality', () => {
		it( 'should render without crashing', () => {
			render( <ButtonBlockAppender rootClientId="test-client-id" /> );

			// Should render a button with "Add block" label
			const button = screen.getByRole( 'button', { name: 'Add block' } );
			expect( button ).toBeInTheDocument();
		} );

		it( 'should render with correct default label', () => {
			render( <ButtonBlockAppender rootClientId="test-client-id" /> );

			// Should render a button with "Add block" label
			const button = screen.getByRole( 'button', { name: 'Add block' } );
			expect( button ).toBeInTheDocument();
			expect( button ).toHaveClass(
				'block-editor-button-block-appender'
			);
		} );

		it( 'should pass through className prop', () => {
			render(
				<ButtonBlockAppender
					rootClientId="test-client-id"
					className="test-class"
				/>
			);

			// The button should have the test class
			const button = screen.getByRole( 'button', { name: 'Add block' } );
			expect( button ).toHaveClass( 'test-class' );
		} );
	} );
} );
