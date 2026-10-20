import type { ComponentType } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Icon as WCIcon, ToolbarItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import {
	isReusableBlock,
	isTemplatePart,
	store as blocksStore,
	switchToBlockType,
} from '@wordpress/blocks';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import BlockIcon from '../../block-icon';
import useBlockDisplayInformation from '../../use-block-display-information';
import useStylesForBlocks from '../../block-styles/use-styles-for-block';
import { store as blockEditorStore } from '../../../store';
import _BlockToolbarIcon, { getBlockIconVariant } from '../block-toolbar-icon';
import { isLayoutVariation } from './utils';

// Its JSDoc marks every prop as required.
const BlockToolbarIcon = _BlockToolbarIcon as unknown as ComponentType< {
	clientIds: string[];
	isSynced?: boolean;
} >;

/*
 * What the block name menu may offer, by the same rules as the current block
 * icon button: `switcher` allows transforms and style presets, `styles-only`
 * (a content-only block, e.g. inside a pattern) only style presets,
 * `pattern-overrides` the overrides of a synced pattern, and `default`
 * nothing, so the name is just a label.
 */
type NameVariant = 'switcher' | 'styles-only' | 'pattern-overrides' | 'default';

type BlockStyle = { name: string; label?: string };

type TransformItem = { id?: string; name: string; title: string; icon?: any };

// The transforms people reach for most, shown before the rest.
const PRIORITY_TRANSFORMS = [
	'core/paragraph',
	'core/heading',
	'core/list',
	'core/quote',
];

// How many transforms show before the rest go under More.
const VISIBLE_TRANSFORMS = 3;

function sortTransforms( transforms: TransformItem[] ): TransformItem[] {
	const priority = PRIORITY_TRANSFORMS.flatMap( ( name ) =>
		transforms.filter( ( item ) => item.name === name )
	);
	const rest = transforms.filter(
		( item ) => ! PRIORITY_TRANSFORMS.includes( item.name )
	);
	return [ ...priority, ...rest ];
}

function TransformItems( {
	items,
	onSelect,
}: {
	items: TransformItem[];
	onSelect: ( item: TransformItem ) => void;
} ) {
	return items.map( ( item ) => (
		<Menu.Item
			key={ item.id ?? item.name }
			prefix={ <BlockIcon icon={ item.icon } showColors /> }
			onClick={ () => onSelect( item ) }
		>
			<Menu.ItemLabel>{ item.title }</Menu.ItemLabel>
		</Menu.Item>
	) );
}

function StylePresets( {
	clientId,
	withSeparator,
}: {
	clientId: string;
	withSeparator: boolean;
} ) {
	const { onSelect, stylesToRender, activeStyle } = useStylesForBlocks( {
		clientId,
		onSwitch: () => {},
	} ) as {
		onSelect: ( style: BlockStyle ) => void;
		stylesToRender?: BlockStyle[];
		activeStyle?: BlockStyle;
	};
	if ( ! stylesToRender || stylesToRender.length < 2 ) {
		return null;
	}
	return (
		<>
			{ withSeparator && <Menu.Separator /> }
			<Menu.RadioGroup
				value={ activeStyle?.name ?? null }
				onValueChange={ ( name ) => {
					const style = stylesToRender.find(
						( { name: styleName } ) => styleName === name
					);
					if ( style ) {
						onSelect( style );
					}
				} }
			>
				<Menu.GroupLabel>{ __( 'Style presets' ) }</Menu.GroupLabel>
				{ stylesToRender.map( ( style ) => (
					<Menu.RadioItem key={ style.name } value={ style.name }>
						<Menu.ItemLabel>
							{ style.label || style.name }
						</Menu.ItemLabel>
					</Menu.RadioItem>
				) ) }
			</Menu.RadioGroup>
		</>
	);
}

/**
 * The block name button: shows what the block is ("Paragraph") and is the one
 * place to turn it into something else or pick one of its style presets.
 * It replaces the block switcher and ad hoc transform controls such as the
 * heading level dropdown.
 *
 * @param props           Component props.
 * @param props.clientIds Selected blocks.
 */
export default function BlockNameMenu( {
	clientIds,
}: {
	clientIds: string[];
} ) {
	const isSingle = clientIds.length === 1;
	const [ firstClientId ] = clientIds;
	const blockInformation = useBlockDisplayInformation( firstClientId );
	const { replaceBlocks, multiSelect, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const {
		blocks,
		transforms,
		variations,
		activeVariation,
		canTransform,
		variant,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockRootClientId,
				getBlockTransformItems,
				canRemoveBlocks,
				getBlockAttributes,
				getBlockName,
			} = select( blockEditorStore );
			const { getBlockVariations, getActiveBlockVariation } =
				select( blocksStore );
			const _blocks = getBlocksByClientId( clientIds ) as any[];
			const name = isSingle ? getBlockName( firstClientId ) : null;
			return {
				blocks: _blocks,
				transforms: getBlockTransformItems(
					_blocks,
					getBlockRootClientId( firstClientId )
				),
				variations: name
					? getBlockVariations( name, 'transform' )
					: undefined,
				activeVariation: name
					? getActiveBlockVariation(
							name,
							getBlockAttributes( firstClientId ) ?? {}
						)
					: undefined,
				canTransform: canRemoveBlocks( clientIds ),
				variant: getBlockIconVariant( {
					select,
					clientIds,
				} ) as NameVariant,
			};
		},
		[ clientIds, firstClientId, isSingle ]
	);

	const isSynced =
		isSingle &&
		( isReusableBlock( blocks[ 0 ] ) || isTemplatePart( blocks[ 0 ] ) );

	const allowTransforms = variant === 'switcher';
	const allowStyles = variant === 'switcher' || variant === 'styles-only';

	const sortedTransforms = useMemo(
		() =>
			allowTransforms && canTransform && ! isSynced
				? sortTransforms( ( transforms ?? [] ) as TransformItem[] )
				: [],
		[ allowTransforms, canTransform, isSynced, transforms ]
	);
	// Variations that only switch the layout belong to the Layout button.
	const contentVariations = useMemo(
		() =>
			allowTransforms
				? ( variations ?? [] ).filter(
						( variation ) => ! isLayoutVariation( variation )
					)
				: [],
		[ allowTransforms, variations ]
	);

	function selectForMultipleBlocks( insertedBlocks: { clientId: string }[] ) {
		if ( insertedBlocks.length > 1 ) {
			multiSelect(
				insertedBlocks[ 0 ].clientId,
				insertedBlocks[ insertedBlocks.length - 1 ].clientId
			);
		}
	}

	function onTransform( { name }: TransformItem ) {
		const newBlocks = switchToBlockType( blocks, name );
		if ( ! newBlocks ) {
			return;
		}
		replaceBlocks( clientIds, newBlocks );
		selectForMultipleBlocks( newBlocks );
	}

	function onSelectVariation( variationName: string ) {
		const variation = contentVariations.find(
			( { name } ) => name === variationName
		);
		if ( variation ) {
			updateBlockAttributes( firstClientId, variation.attributes ?? {} );
		}
	}

	const label = isSingle
		? blockInformation?.title
		: sprintf(
				/* translators: %d: number of blocks. */
				_n( '%d block', '%d blocks', clientIds.length ),
				clientIds.length
			);
	const visibleTransforms = sortedTransforms.slice( 0, VISIBLE_TRANSFORMS );
	const moreTransforms = sortedTransforms.slice( VISIBLE_TRANSFORMS );

	// A synced pattern's overrides keep their own menu for now.
	if ( variant === 'pattern-overrides' ) {
		return <BlockToolbarIcon clientIds={ clientIds } isSynced />;
	}

	const nameContent = (
		<>
			<BlockIcon
				icon={ isSingle ? blockInformation?.icon : null }
				showColors
			/>
			<span className="block-editor-block-toolbar-redesign__name-label">
				{ label }
			</span>
		</>
	);

	// Nothing can change: the name is only a label.
	if ( ! allowTransforms && ! allowStyles ) {
		return (
			<ToolbarItem>
				{ ( itemProps ) => (
					<Button
						{ ...itemProps }
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled
						className="block-editor-block-toolbar-redesign__name is-label"
					>
						{ nameContent }
					</Button>
				) }
			</ToolbarItem>
		);
	}

	return (
		<Menu.Root>
			<ToolbarItem>
				{ ( itemProps ) => (
					<Menu.Trigger
						render={
							<Button
								{ ...itemProps }
								__next40pxDefaultSize
								className="block-editor-block-toolbar-redesign__name"
								description={ __(
									'Change block type or style'
								) }
							/>
						}
					>
						{ nameContent }
						<WCIcon
							className="block-editor-block-toolbar-redesign__chevron"
							icon={ chevronDown }
							size={ 16 }
						/>
					</Menu.Trigger>
				) }
			</ToolbarItem>
			<Menu.Popup
				className="block-editor-block-toolbar-redesign__menu"
				positioner={ <Menu.Positioner side="bottom" align="start" /> }
			>
				{ contentVariations.length > 1 && (
					<Menu.RadioGroup
						value={ activeVariation?.name ?? null }
						onValueChange={ onSelectVariation }
					>
						<Menu.GroupLabel>{ __( 'Type' ) }</Menu.GroupLabel>
						{ contentVariations.map( ( variation ) => (
							<Menu.RadioItem
								key={ variation.name }
								value={ variation.name }
							>
								<Menu.ItemLabel>
									{ variation.title }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				) }
				{ contentVariations.length > 1 &&
					!! sortedTransforms.length && <Menu.Separator /> }
				{ !! sortedTransforms.length && (
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Transform' ) }</Menu.GroupLabel>
						<TransformItems
							items={ visibleTransforms }
							onSelect={ onTransform }
						/>
						{ !! moreTransforms.length && (
							<Menu.SubmenuRoot>
								<Menu.SubmenuTrigger>
									<Menu.ItemLabel>
										{ __( 'More' ) }
									</Menu.ItemLabel>
								</Menu.SubmenuTrigger>
								<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
									<TransformItems
										items={ moreTransforms }
										onSelect={ onTransform }
									/>
								</Menu.Popup>
							</Menu.SubmenuRoot>
						) }
					</Menu.Group>
				) }
				{ isSingle && allowStyles && (
					<StylePresets
						clientId={ firstClientId }
						withSeparator={
							!! sortedTransforms.length ||
							contentVariations.length > 1
						}
					/>
				) }
				{ allowTransforms &&
					! sortedTransforms.length &&
					contentVariations.length < 2 && (
						<Menu.Item disabled>
							<Menu.ItemLabel>
								{ __( 'No transforms.' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
			</Menu.Popup>
		</Menu.Root>
	);
}
