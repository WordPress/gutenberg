/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { paragraph } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockToolbarIcon from '../block-toolbar-icon';

jest.mock( '../../block-title/use-block-display-title', () =>
	jest.fn().mockReturnValue( 'Block Name' )
);
jest.mock( '../../block-switcher', () =>
	jest.fn( ( { children } ) => (
		<div data-testid="block-switcher">{ children }</div>
	) )
);
jest.mock( '../pattern-overrides-dropdown', () =>
	jest.fn( ( { label } ) => (
		<div data-testid="pattern-overrides-dropdown">{ label }</div>
	) )
);

describe( 'BlockToolbarIcon', () => {
	const defaultProps = {
		clientIds: [ 'test-client-id' ],
		icon: paragraph,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'when showBlockSwitcher is true', () => {
		it( 'should render BlockSwitcher with icon', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					showBlockSwitcher
					showPatternOverrides={ false }
					firstBlockName={ undefined }
				/>
			);

			expect(
				screen.getByTestId( 'block-switcher' )
			).toBeInTheDocument();
			expect(
				screen.queryByTestId( 'pattern-overrides-dropdown' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'when showPatternOverrides is true', () => {
		it( 'should render PatternOverridesDropdown for single block', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					showBlockSwitcher={ false }
					showPatternOverrides
					firstBlockName="My Override"
				/>
			);

			const dropdown = screen.getByTestId( 'pattern-overrides-dropdown' );
			expect( dropdown ).toBeInTheDocument();
			expect( dropdown ).toHaveTextContent( 'Block Name' );
			expect(
				screen.queryByTestId( 'block-switcher' )
			).not.toBeInTheDocument();
		} );

		it( 'should render PatternOverridesDropdown for multiple blocks', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2' ] }
					showBlockSwitcher={ false }
					showPatternOverrides
					firstBlockName={ undefined }
				/>
			);

			const dropdown = screen.getByTestId( 'pattern-overrides-dropdown' );
			expect( dropdown ).toBeInTheDocument();
			expect( dropdown ).toHaveTextContent( 'Multiple blocks selected' );
		} );
	} );

	describe( 'when neither showBlockSwitcher nor showPatternOverrides is true', () => {
		it( 'should render disabled ToolbarButton for single block', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					showBlockSwitcher={ false }
					showPatternOverrides={ false }
					firstBlockName={ undefined }
				/>
			);

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block Name' );
			expect(
				screen.queryByTestId( 'block-switcher' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId( 'pattern-overrides-dropdown' )
			).not.toBeInTheDocument();
		} );

		it( 'should render disabled ToolbarButton for multiple blocks', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2', 'test-3' ] }
					showBlockSwitcher={ false }
					showPatternOverrides={ false }
					firstBlockName={ undefined }
				/>
			);

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( button ).toHaveAttribute(
				'aria-label',
				'Multiple blocks selected'
			);
		} );
	} );

	describe( 'label calculation', () => {
		it( 'should use block title for single block', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					showBlockSwitcher={ false }
					showPatternOverrides={ false }
				/>
			);

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block Name' );
		} );

		it( 'should use "Multiple blocks selected" for multiple blocks', () => {
			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2' ] }
					showBlockSwitcher={ false }
					showPatternOverrides={ false }
				/>
			);

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute(
				'aria-label',
				'Multiple blocks selected'
			);
		} );
	} );
} );
