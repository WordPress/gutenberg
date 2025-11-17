/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { paragraph } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockToolbarIcon from '../block-toolbar-icon';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../../block-title/use-block-display-title', () =>
	jest.fn().mockReturnValue( 'Block Name' )
);
jest.mock( '../../block-switcher', () =>
	jest.fn( ( { children } ) => (
		<div data-testid="block-switcher">{ children }</div>
	) )
);

describe( 'BlockToolbarIcon', () => {
	const defaultProps = {
		clientIds: [ 'test-client-id' ],
		isSynced: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'when variant is "switcher"', () => {
		it( 'should render BlockSwitcher with icon', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'switcher',
			} ) );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect(
				screen.getByTestId( 'block-switcher' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'when variant is "default"', () => {
		it( 'should render disabled ToolbarButton for single block', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block Name' );
			expect(
				screen.queryByTestId( 'block-switcher' )
			).not.toBeInTheDocument();
		} );

		it( 'should render disabled ToolbarButton for multiple blocks', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2', 'test-3' ] }
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
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block Name' );
		} );

		it( 'should use "Multiple blocks selected" for multiple blocks', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2' ] }
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
