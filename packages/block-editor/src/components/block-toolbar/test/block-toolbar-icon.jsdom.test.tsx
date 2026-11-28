import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ReactNode } from 'react';
import type { getBlockType } from '@wordpress/blocks';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { paragraph } from '@wordpress/icons';
import type { unlock } from '../../../lock-unlock';
import type BlockIcon from '../../block-icon';
import type BlockSwitcher from '../../block-switcher';
import BlockToolbarIcon from '../block-toolbar-icon';

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const actualImplementation = await importOriginal();
	return {
		...actualImplementation,
		// Block types with only what the toolbar icon reads.
		getBlockType: ( ( name: string ) =>
			name
				? {
						name,
						title:
							name === 'core/template-part'
								? 'Template Part'
								: 'Group',
						icon: `${ name }-icon`,
					}
				: undefined ) as unknown as typeof getBlockType,
	};
} );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );
vi.mock( import( '../../../lock-unlock' ), () => ( {
	// Returns the selectors themselves, with the private ones mixed in.
	unlock: ( ( value: object ) => ( {
		registerPrivateActions: vi.fn(),
		registerPrivateSelectors: vi.fn(),
		...value,
	} ) ) as typeof unlock,
} ) );
vi.mock( import( '../../block-title/use-block-display-title' ), () => ( {
	default: () => 'Block Name',
} ) );
vi.mock( import( '../../block-icon' ), () => ( {
	// Renders the icon as text, which the test icons are.
	default: ( ( { icon }: { icon: ReactNode } ) => (
		<span data-testid="block-icon">{ icon }</span>
	) ) as unknown as typeof BlockIcon,
} ) );
vi.mock( import( '../../block-switcher' ), () => ( {
	// Takes the props the switcher uses as a plain component.
	default: ( ( { children }: { children: ReactNode } ) => (
		<div data-testid="block-switcher">{ children }</div>
	) ) as typeof BlockSwitcher,
} ) );
vi.mock( import( '../pattern-overrides-dropdown' ), () => ( {
	default: ( { clientIds }: { clientIds: string[] } ) => (
		<div data-testid="pattern-overrides-dropdown">
			{ clientIds.length === 1
				? 'Block Name'
				: 'Multiple blocks selected' }
		</div>
	),
} ) );

// The mocked hook returns what each test sets up.
const mockedUseSelect = useSelect as unknown as Mock<
	( mapSelect: ( select: unknown ) => unknown ) => unknown
>;

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
	}: {
		attributes?: Record< string, unknown >;
		blockName?: string;
		getActiveBlockVariation?: () => unknown;
		isSectionBlock?: boolean;
	} = {} ) => {
		mockedUseSelect.mockImplementation(
			( mapSelect: ( select: unknown ) => unknown ) =>
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
			mockedUseSelect.mockImplementation( () => ( {
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
			mockedUseSelect.mockImplementation( () => ( {
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
			mockedUseSelect.mockImplementation( () => ( {
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
			mockedUseSelect.mockImplementation( () => ( {
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
			mockedUseSelect.mockImplementation( () => ( {
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
			mockedUseSelect.mockImplementation( () => ( {
				icon: paragraph,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render( <BlockToolbarIcon { ...defaultProps } /> );

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block Name' );
		} );

		it( 'should use "Multiple blocks selected" for multiple blocks', () => {
			mockedUseSelect.mockImplementation( () => ( {
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

	describe( 'when no block is selected (placeholder)', () => {
		it( 'should keep a discernible label when no default block type is registered', () => {
			mockedUseSelect.mockImplementation( () => ( {
				icon: undefined,
				showIconLabels: false,
				variant: 'default',
			} ) );

			render( <BlockToolbarIcon clientIds={ [] } isSynced={ false } /> );

			const button = screen.getByRole( 'button' );
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( button ).toHaveAttribute( 'aria-label', 'Block' );
		} );
	} );
} );
