import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { paragraph } from '@wordpress/icons';
import BlockToolbarIcon from '../block-toolbar-icon';

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const actualImplementation = await importOriginal();
	return {
		...actualImplementation,
		getBlockType: ( name ) => ( {
			name,
			title: name === 'core/template-part' ? 'Template Part' : 'Group',
			icon: `${ name }-icon`,
		} ),
	};
} );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );
vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( value ) => ( {
		registerPrivateActions: vi.fn(),
		registerPrivateSelectors: vi.fn(),
		...value,
	} ),
} ) );
vi.mock( import( '../../block-title/use-block-display-title' ), () => ( {
	default: vi.fn().mockReturnValue( 'Block Name' ),
} ) );
vi.mock( import( '../../block-icon' ), () => ( {
	default: vi.fn( ( { icon } ) => (
		<span data-testid="block-icon">{ icon }</span>
	) ),
} ) );
vi.mock( import( '../../block-switcher' ), () => ( {
	default: vi.fn( ( { children } ) => (
		<div data-testid="block-switcher">{ children }</div>
	) ),
} ) );
vi.mock( import( '../pattern-overrides-dropdown' ), () => ( {
	default: vi.fn( ( { clientIds } ) => (
		<div data-testid="pattern-overrides-dropdown">
			{ clientIds.length === 1
				? 'Block Name'
				: 'Multiple blocks selected' }
		</div>
	) ),
} ) );

describe( 'BlockToolbarIcon', () => {
	const defaultProps = {
		clientIds: [ 'test-client-id' ],
		isSynced: false,
	};
	const setupToolbarSelectors = ( {
		attributes = {
			metadata: {
				patternName: 'theme/hero',
			},
		},
		blockName = 'core/group',
		getActiveBlockVariation = () => null,
		isSectionBlock = true,
	} = {} ) => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				get: () => false,
				getBlockName: () => blockName,
				getBlockAttributes: () => attributes,
				getBlockParentsByBlockName: () => [],
				canRemoveBlocks: () => true,
				getTemplateLock: () => undefined,
				getBlockEditingMode: () => 'default',
				canEditBlock: () => true,
				getBlockStyles: () => [ {} ],
				getActiveBlockVariation,
				isSectionBlock: () => isSectionBlock,
			} ) )
		);
	};

	beforeEach( () => {
		vi.clearAllMocks();
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
			expect(
				screen.queryByTestId( 'pattern-overrides-dropdown' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'when variant is "pattern-overrides"', () => {
		it( 'should render PatternOverridesDropdown for single block', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'pattern-overrides',
			} ) );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			const dropdown = screen.getByTestId( 'pattern-overrides-dropdown' );
			expect( dropdown ).toBeInTheDocument();
			expect( dropdown ).toHaveTextContent( 'Block Name' );
			expect(
				screen.queryByTestId( 'block-switcher' )
			).not.toBeInTheDocument();
		} );

		it( 'should render PatternOverridesDropdown for multiple blocks', () => {
			useSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'pattern-overrides',
			} ) );

			render(
				<BlockToolbarIcon
					{ ...defaultProps }
					clientIds={ [ 'test-1', 'test-2' ] }
				/>
			);

			const dropdown = screen.getByTestId( 'pattern-overrides-dropdown' );
			expect( dropdown ).toBeInTheDocument();
			expect( dropdown ).toHaveTextContent( 'Multiple blocks selected' );
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
			expect(
				screen.queryByTestId( 'pattern-overrides-dropdown' )
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

	describe( 'pattern sections', () => {
		it( 'should not show the block switcher before the section is being edited', () => {
			setupToolbarSelectors();

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect(
				screen.queryByTestId( 'block-switcher' )
			).not.toBeInTheDocument();
			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should show the block switcher when the section is being edited', () => {
			setupToolbarSelectors( { isSectionBlock: false } );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect(
				screen.getByTestId( 'block-switcher' )
			).toBeInTheDocument();
		} );

		it( 'should show the block icon for pattern wrappers in isolated editors', () => {
			setupToolbarSelectors( {
				attributes: {
					metadata: {
						name: 'Header',
						patternName: 'theme/header-wrapper',
					},
				},
				isSectionBlock: false,
			} );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect(
				screen.getByTestId( 'block-switcher' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'block-icon' ) ).toHaveTextContent(
				'core/group-icon'
			);
		} );

		it( 'should show the block switcher when content-only editing is disabled', () => {
			setupToolbarSelectors( {
				isSectionBlock: false,
			} );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect(
				screen.getByTestId( 'block-switcher' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'block-icon' ) ).toHaveTextContent(
				'core/group-icon'
			);
		} );

		it( 'should show the block icon for section blocks without pattern metadata', () => {
			setupToolbarSelectors( {
				attributes: {},
				blockName: 'core/template-part',
			} );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			expect( screen.getByTestId( 'block-icon' ) ).toHaveTextContent(
				'core/template-part-icon'
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
