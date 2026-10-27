import clsx from 'clsx';
import {
	getBlockType,
	getDefaultBlockName,
	isReusableBlock,
	isTemplatePart,
	store as blocksStore,
	switchToBlockType,
} from '@wordpress/blocks';
import type { Block, BlockStyle } from '@wordpress/blocks';
import { Button, ToolbarItem, ToolbarGroup } from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { chevronDownSmall, copy, lock, Icon } from '@wordpress/icons';
import type { ReactNode } from 'react';
import SubmenuPopup, {
	SUBMENU_TRIGGER_PROPS,
	useFlyoutAim,
} from './submenu-popup';
import SearchField from './search-field';
import BlockIcon from '../../block-icon';
import useBlockDisplayTitle from '../../block-title/use-block-display-title';
import { useBlockLock } from '../../block-lock';
import useStylesForBlocks from '../../block-styles/use-styles-for-block';
import useTransformedPatterns from '../../block-switcher/use-transformed-patterns';
import PatternOverridesDropdown from '../pattern-overrides-dropdown';
import { getBlockIcon, getBlockIconVariant } from '../block-toolbar-icon';
import { store as blockEditorStore } from '../../../store';
import type { InserterItem } from '../../../store/types';

/**
 * The transforms shown at the top level of the menu, in this order. The rest
 * go in the More submenu.
 */
const PRIORITY_TRANSFORMS = [
	'core/paragraph',
	'core/heading',
	'core/list',
	'core/quote',
];

function MenuIcon( { icon }: { icon?: IconType } ) {
	if ( ! icon ) {
		return null;
	}
	return (
		<span className="block-editor-block-toolbar__menu-block-icon">
			<BlockIcon icon={ icon } />
		</span>
	);
}

/**
 * The visible name of the selected block, with its icon.
 *
 * @param props         Component props.
 * @param props.icon    The icon.
 * @param props.label   The name.
 * @param props.hasMenu Whether the button opens a menu.
 */
function BlockNameContent( {
	icon,
	label,
	hasMenu,
}: {
	icon: ReactNode;
	label: string;
	hasMenu: boolean;
} ) {
	return (
		<>
			{ icon }
			<span className="block-editor-block-toolbar__block-name-label">
				{ label }
			</span>
			{ hasMenu && (
				<Icon
					className="block-editor-block-toolbar__block-name-chevron"
					icon={ chevronDownSmall }
					size={ 24 }
				/>
			) }
		</>
	);
}

/**
 * An action the menus can find by searching.
 */
export interface SearchEntry {
	key: string;
	label: string;
	icon?: IconType;
	/**
	 * Where the action lives, shown next to it in the results.
	 */
	context: string;
	keywords?: string[];
	onSelect: () => void;
}

/**
 * Whether a search entry matches a search.
 *
 * @param entry  The entry.
 * @param search The search, trimmed and lower case.
 * @return Whether it matches.
 */
export function matchesSearchEntry( entry: SearchEntry, search: string ) {
	return [ entry.label, entry.context, ...( entry.keywords ?? [] ) ].some(
		( text ) => text.toLocaleLowerCase().includes( search )
	);
}

/**
 * The transforms, variations and style presets of the selected blocks, for
 * the block name menu and the search of the options menu.
 *
 * @param clientIds      The client IDs of the blocks.
 * @param showTransforms Whether the blocks can be transformed.
 * @return The menu data, and the actions as search entries.
 */
export function useTransformsAndStyles(
	clientIds: string[],
	showTransforms: boolean
) {
	const { replaceBlocks, multiSelect, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const { possibleBlockTransformations, patterns, blocks, canRemove } =
		useSelect(
			( select ) => {
				const {
					getBlocksByClientId,
					getBlockRootClientId,
					getBlockTransformItems,
					__experimentalGetPatternTransformItems,
					canRemoveBlocks,
				} = select( blockEditorStore );
				const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
				// The selected blocks exist.
				const _blocks = getBlocksByClientId( clientIds ) as Block[];
				return {
					blocks: _blocks,
					possibleBlockTransformations: getBlockTransformItems(
						_blocks,
						rootClientId
					),
					patterns: __experimentalGetPatternTransformItems(
						_blocks,
						rootClientId
					),
					canRemove: canRemoveBlocks( clientIds ),
				};
			},
			[ clientIds ]
		);
	const isSingleBlock = blocks.length === 1;
	const { activeBlockVariationName, variations } = useSelect(
		( select ) => {
			if ( ! isSingleBlock || ! canRemove ) {
				return {};
			}
			const { getActiveBlockVariation, getBlockVariations } =
				select( blocksStore );
			return {
				variations: getBlockVariations( blocks[ 0 ].name, 'transform' ),
				activeBlockVariationName: getActiveBlockVariation(
					blocks[ 0 ].name,
					blocks[ 0 ].attributes
				)?.name,
			};
		},
		[ blocks, isSingleBlock, canRemove ]
	);
	const transformedPatterns = useTransformedPatterns(
		canRemove ? patterns : [],
		blocks
	);
	const {
		onSelect: onSelectStyle,
		stylesToRender,
		activeStyle,
	} = useStylesForBlocks( {
		clientId: clientIds[ 0 ],
		onSwitch: () => {},
	} );

	const isSynced =
		isSingleBlock &&
		( isTemplatePart( blocks[ 0 ] ) || isReusableBlock( blocks[ 0 ] ) );
	const hasTransforms = showTransforms && canRemove && ! isSynced;
	const { priorityTransforms, restTransforms } = useMemo( () => {
		const transforms: InserterItem[] = hasTransforms
			? possibleBlockTransformations
			: [];
		const priority = transforms
			.filter( ( item ) => PRIORITY_TRANSFORMS.includes( item.name ) )
			.sort(
				( a, b ) =>
					PRIORITY_TRANSFORMS.indexOf( a.name ) -
					PRIORITY_TRANSFORMS.indexOf( b.name )
			);
		return {
			priorityTransforms: priority,
			restTransforms: transforms.filter(
				( item ) => ! priority.includes( item )
			),
		};
	}, [ hasTransforms, possibleBlockTransformations ] );

	function selectForMultipleBlocks( insertedBlocks: Block[] ) {
		if ( insertedBlocks.length > 1 ) {
			multiSelect(
				insertedBlocks[ 0 ].clientId,
				insertedBlocks[ insertedBlocks.length - 1 ].clientId
			);
		}
	}

	function onTransform( item: InserterItem ) {
		// The offered transformations apply to the blocks.
		const newBlocks = switchToBlockType(
			blocks,
			item.name,
			item.variationName
		)!;
		replaceBlocks( clientIds, newBlocks );
		selectForMultipleBlocks( newBlocks );
	}

	function onPatternTransform( transformedBlocks: Block[] ) {
		replaceBlocks( clientIds, transformedBlocks );
		selectForMultipleBlocks( transformedBlocks );
	}

	function onVariation( name: string ) {
		const variation = variations?.find(
			( { name: variationName } ) => variationName === name
		);
		if ( variation ) {
			updateBlockAttributes( clientIds[ 0 ], {
				...variation.attributes,
			} );
		}
	}

	const styles = isSingleBlock ? ( stylesToRender ?? [] ) : [];
	function onStyle( name: string ) {
		const style = styles.find(
			( { name: styleName } ) => styleName === name
		);
		if ( style ) {
			onSelectStyle( style as BlockStyle );
		}
	}

	const hasVariations = showTransforms && !! variations?.length;

	const searchEntries: SearchEntry[] = [
		...[ ...priorityTransforms, ...restTransforms ]
			.filter( ( item ) => ! item.isDisabled )
			.map( ( item ) => ( {
				key: `transform-${ item.id || item.name }`,
				label: item.title,
				icon: item.icon as IconType,
				context: __( 'Transform' ),
				keywords: item.keywords,
				onSelect: () => onTransform( item ),
			} ) ),
		...transformedPatterns.map( ( pattern ) => ( {
			key: `pattern-${ pattern.name }`,
			label: pattern.title,
			context: __( 'Patterns' ),
			onSelect: () => onPatternTransform( pattern.transformedBlocks ),
		} ) ),
		...( hasVariations ? variations! : [] )
			.filter(
				( variation ) => variation.name !== activeBlockVariationName
			)
			.map( ( variation ) => ( {
				key: `variation-${ variation.name }`,
				label: variation.title,
				icon: variation.icon as IconType,
				context: __( 'Variations' ),
				keywords: variation.keywords,
				onSelect: () => onVariation( variation.name ),
			} ) ),
		...styles
			.filter( ( style ) => style.name !== activeStyle?.name )
			.map( ( style ) => ( {
				key: `style-${ style.name }`,
				label: style.label || style.name,
				context: __( 'Style presets' ),
				onSelect: () => onStyle( style.name ),
			} ) ),
	];

	return {
		priorityTransforms,
		restTransforms,
		transformedPatterns,
		onTransform,
		onPatternTransform,
		variations: hasVariations ? variations! : [],
		activeBlockVariationName,
		onVariation,
		styles,
		activeStyleName: activeStyle?.name,
		onStyle,
		searchEntries,
	};
}

/**
 * Lists the search entries that match a search, or says nothing matched.
 *
 * @param props         Component props.
 * @param props.entries The entries.
 * @param props.search  The search.
 */
export function SearchResults( {
	entries,
	search,
}: {
	entries: SearchEntry[];
	search: string;
} ) {
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const results = entries.filter( ( entry ) =>
		matchesSearchEntry( entry, normalizedSearch )
	);
	if ( ! results.length ) {
		return (
			<p className="block-editor-block-toolbar__options-no-results">
				{ __( 'No results found.' ) }
			</p>
		);
	}
	return results.map( ( entry ) => (
		<Menu.Item
			key={ entry.key }
			onClick={ entry.onSelect }
			prefix={ entry.icon && <MenuIcon icon={ entry.icon } /> }
			suffix={ entry.context }
		>
			<Menu.ItemLabel>{ entry.label }</Menu.ItemLabel>
		</Menu.Item>
	) );
}

function TransformsAndStyles( {
	clientIds,
	showTransforms,
}: {
	clientIds: string[];
	showTransforms: boolean;
} ) {
	const [ search, setSearch ] = useState( '' );
	const {
		priorityTransforms,
		restTransforms,
		transformedPatterns,
		onTransform,
		onPatternTransform,
		variations,
		activeBlockVariationName,
		onVariation,
		styles,
		activeStyleName,
		onStyle,
		searchEntries,
	} = useTransformsAndStyles( clientIds, showTransforms );

	const transformItem = ( item: InserterItem ) => (
		<Menu.Item
			key={ item.id || item.name }
			disabled={ item.isDisabled }
			onClick={ () => onTransform( item ) }
			prefix={ <MenuIcon icon={ item.icon as IconType } /> }
		>
			<Menu.ItemLabel>{ item.title }</Menu.ItemLabel>
		</Menu.Item>
	);

	const hasVariations = !! variations.length;
	const hasTransformItems =
		!! priorityTransforms.length ||
		!! restTransforms.length ||
		!! transformedPatterns.length;

	if ( ! hasTransformItems && ! hasVariations && ! styles.length ) {
		return (
			<p className="block-editor-block-toolbar__options-no-results">
				{ __( 'No transforms.' ) }
			</p>
		);
	}

	const searchField = (
		<SearchField
			label={ __( 'Search transforms and styles' ) }
			value={ search }
			onChange={ setSearch }
		/>
	);

	if ( search.trim() ) {
		return (
			<>
				{ searchField }
				<SearchResults entries={ searchEntries } search={ search } />
			</>
		);
	}

	return (
		<>
			{ searchField }
			{ hasTransformItems && (
				<Menu.Group>
					<Menu.GroupLabel>{ __( 'Transform' ) }</Menu.GroupLabel>
					{ priorityTransforms.map( transformItem ) }
					{ ( !! restTransforms.length ||
						!! transformedPatterns.length ) && (
						<Menu.SubmenuRoot>
							<Menu.SubmenuTrigger { ...SUBMENU_TRIGGER_PROPS }>
								<Menu.ItemLabel>
									{ __( 'More' ) }
								</Menu.ItemLabel>
							</Menu.SubmenuTrigger>
							<SubmenuPopup>
								{ restTransforms.map( transformItem ) }
								{ !! transformedPatterns.length && (
									<>
										{ !! restTransforms.length && (
											<Menu.Separator />
										) }
										<Menu.Group>
											<Menu.GroupLabel>
												{ __( 'Patterns' ) }
											</Menu.GroupLabel>
											{ transformedPatterns.map(
												( pattern ) => (
													<Menu.Item
														key={ pattern.name }
														onClick={ () =>
															onPatternTransform(
																pattern.transformedBlocks
															)
														}
													>
														<Menu.ItemLabel>
															{ pattern.title }
														</Menu.ItemLabel>
													</Menu.Item>
												)
											) }
										</Menu.Group>
									</>
								) }
							</SubmenuPopup>
						</Menu.SubmenuRoot>
					) }
				</Menu.Group>
			) }
			{ hasVariations && (
				<>
					{ hasTransformItems && <Menu.Separator /> }
					<Menu.RadioGroup
						value={ activeBlockVariationName ?? null }
						onValueChange={ onVariation }
					>
						<Menu.GroupLabel>
							{ __( 'Variations' ) }
						</Menu.GroupLabel>
						{ variations.map( ( variation ) => (
							<Menu.RadioItem
								key={ variation.name }
								value={ variation.name }
								prefix={
									<MenuIcon
										icon={ variation.icon as IconType }
									/>
								}
							>
								<Menu.ItemLabel>
									{ variation.title }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</>
			) }
			{ !! styles.length && (
				<>
					{ ( hasTransformItems || hasVariations ) && (
						<Menu.Separator />
					) }
					<Menu.RadioGroup
						value={ activeStyleName ?? null }
						onValueChange={ onStyle }
					>
						<Menu.GroupLabel>
							{ __( 'Style presets' ) }
						</Menu.GroupLabel>
						{ styles.map( ( style ) => (
							<Menu.RadioItem
								key={ style.name }
								value={ style.name }
							>
								<Menu.ItemLabel>
									{ style.label || style.name }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</>
			) }
		</>
	);
}

/**
 * Shows the name of the selected block and opens the menu to transform it or
 * pick a style preset. This replaces the block icon of the toolbar, and ad hoc
 * transform controls, such as the heading level, in favor of one entry point.
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the blocks.
 * @param props.isSynced  Whether the block is synced.
 */
export default function BlockNameMenu( {
	clientIds,
	isSynced,
}: {
	clientIds: string[];
	isSynced: boolean;
} ) {
	const { icon, variant } = useSelect(
		( select ) => ( {
			icon: getBlockIcon( { select, clientIds } ),
			variant: getBlockIconVariant( { select, clientIds } ),
		} ),
		[ clientIds ]
	);
	const { isLocked } = useBlockLock( clientIds[ 0 ] );
	const flyoutAimRef = useFlyoutAim();
	const blockTitle = useBlockDisplayTitle( {
		clientId: clientIds[ 0 ],
		maximumLength: 35,
	} ) as string;

	const count = clientIds.length;
	let label = blockTitle;
	if ( ! count ) {
		label =
			getBlockType(
				// `getBlockType` returns nothing without a default block.
				getDefaultBlockName()!
			)?.title ?? __( 'Block' );
	} else if ( count > 1 ) {
		label = sprintf(
			/* translators: %d: number of blocks. */
			_n( '%d block', '%d blocks', count ),
			count
		);
	}

	// A locked block shows the lock in place of its icon.
	const iconElement = (
		<BlockIcon
			className="block-editor-block-toolbar__block-icon"
			icon={ count === 1 && isLocked ? lock : ( icon ?? copy ) }
		/>
	);

	if ( variant === 'pattern-overrides' ) {
		return (
			<ToolbarGroup className="block-editor-block-toolbar__block-name">
				<PatternOverridesDropdown
					icon={ iconElement }
					clientIds={ clientIds }
					blockTitle={ blockTitle }
					label={ label }
				/>
			</ToolbarGroup>
		);
	}

	const hasMenu = variant === 'switcher' || variant === 'styles-only';
	const className = clsx( 'block-editor-block-toolbar__block-name-button', {
		'is-synced': isSynced,
	} );

	if ( ! hasMenu ) {
		return (
			<ToolbarGroup className="block-editor-block-toolbar__block-name">
				<ToolbarItem>
					{ ( toolbarItemProps ) => (
						<Button
							size="compact"
							{ ...toolbarItemProps }
							className={ className }
							disabled
							accessibleWhenDisabled
						>
							<BlockNameContent
								icon={ iconElement }
								label={ label }
								hasMenu={ false }
							/>
						</Button>
					) }
				</ToolbarItem>
			</ToolbarGroup>
		);
	}

	const description =
		count === 1
			? __( 'Change block type or style' )
			: sprintf(
					/* translators: %d: number of blocks. */
					_n(
						'Change type of %d block',
						'Change type of %d blocks',
						count
					),
					count
				);

	return (
		<ToolbarGroup className="block-editor-block-toolbar__block-name">
			<Menu.Root
				// Like the other toolbar dropdowns, the menu does not trap focus.
				modal={ false }
			>
				<ToolbarItem>
					{ ( toolbarItemProps ) => (
						<Menu.Trigger
							{ ...toolbarItemProps }
							render={
								<Button
									size="compact"
									className={ className }
									description={ description }
								/>
							}
						>
							<BlockNameContent
								icon={ iconElement }
								label={ label }
								hasMenu
							/>
						</Menu.Trigger>
					) }
				</ToolbarItem>
				<Menu.Popup
					ref={ flyoutAimRef }
					className="block-editor-block-toolbar__block-name-menu"
					positioner={
						<Menu.Positioner
							className="block-editor-block-toolbar__menu-positioner"
							side="bottom"
							align="start"
						/>
					}
				>
					<TransformsAndStyles
						clientIds={ clientIds }
						showTransforms={ variant === 'switcher' }
					/>
				</Menu.Popup>
			</Menu.Root>
		</ToolbarGroup>
	);
}
