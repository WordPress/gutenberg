import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import {
	hasBlockSupport,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { getSetting } from '@wordpress/global-styles-engine';
import type {
	FontFamilyPreset,
	FontSizePreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import {
	BlockControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import WritingStyleDropdown from './style-dropdown';
import WritingFontDropdown from './font-dropdown';
import WritingSizeDropdown from './size-dropdown';
import {
	findActiveWritingStyle,
	getSteppedFontSize,
	getWritingStyles,
	groupWritingStylesByFont,
} from './utils';
import type { WritingBlock, WritingStyle } from './types';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const PRESET_ORIGINS = [ 'default', 'theme', 'custom' ] as const;

const EMPTY_ARRAY: never[] = [];

type WritingToolbarAttributes = {
	fontFamily?: string;
	fontSize?: string;
	style?: { typography?: { fontSize?: string } };
	[ key: string ]: unknown;
};

type WritingToolbarProps = {
	clientId: string;
	name: string;
	isSelected: boolean;
	attributes: WritingToolbarAttributes;
	setAttributes: ( attributes: Partial< WritingToolbarAttributes > ) => void;
};

/**
 * Reads a preset setting across its origins, the way the typography inspector
 * does, so the toolbar offers the same fonts and sizes.
 *
 * @param globalStyles The merged global styles.
 * @param path         The setting path.
 *
 * @return The presets.
 */
function getPresets< T >(
	globalStyles: GlobalStylesConfig,
	path: string
): T[] {
	const presets =
		getSetting< Record< string, T[] > >( globalStyles, path ) ?? {};
	return PRESET_ORIGINS.flatMap( ( origin ) => presets[ origin ] ?? [] );
}

function WritingToolbarControls( {
	clientId,
	name,
	attributes,
	setAttributes,
}: WritingToolbarProps ) {
	// The hook is still JavaScript, so its shape is asserted here.
	const { merged: globalStyles } = useGlobalStyles() as {
		merged: GlobalStylesConfig;
	};
	const { replaceBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const registry = useRegistry();

	/*
	 * Every value a `useSelect` returns has to keep its identity while the
	 * state behind it is unchanged, or the toolbar re-renders on every store
	 * change. `getBlock` hands back the block's own tree entry, and
	 * `getBlockTransformItems` memoizes on that entry, so both stay stable;
	 * arrays derived inside the selector would not.
	 */
	const { block, rootClientId, blockTypes } = useSelect(
		( select ) => {
			const { getBlock, getBlockRootClientId } =
				select( blockEditorStore );

			return {
				block: getBlock( clientId ) as Block | null,
				rootClientId: getBlockRootClientId( clientId ),
				blockTypes: select( blocksStore ).getBlockTypes(),
			};
		},
		[ clientId ]
	);

	const transformItems = useSelect(
		( select ) =>
			block
				? select( blockEditorStore ).getBlockTransformItems(
						block,
						rootClientId
					)
				: EMPTY_ARRAY,
		[ block, rootClientId ]
	);

	const writingBlocks = useMemo( () => {
		// Variations are registration data, which only changes alongside the
		// block types themselves, so they are read rather than subscribed to.
		const { getBlockVariations } = registry.select( blocksStore );

		return blockTypes
			.filter( ( blockType ) =>
				hasBlockSupport( blockType, 'writing', false )
			)
			.map( ( blockType ): WritingBlock => ( {
				name: blockType.name,
				title: blockType.title,
				variations:
					getBlockVariations( blockType.name, 'transform' ) ?? [],
			} ) );
	}, [ blockTypes, registry ] );

	const fontFamilies = useMemo(
		() =>
			getPresets< FontFamilyPreset >(
				globalStyles,
				'typography.fontFamilies'
			),
		[ globalStyles ]
	);
	const fontSizes = useMemo(
		() =>
			getPresets< FontSizePreset >(
				globalStyles,
				'typography.fontSizes'
			),
		[ globalStyles ]
	);

	const groups = useMemo( () => {
		// A style the block cannot be turned into is still listed, so the menu
		// reads as the whole set the theme offers, but it cannot be chosen.
		const reachable = new Set( [
			name,
			...transformItems.map( ( item: { name: string } ) => item.name ),
		] );

		return groupWritingStylesByFont(
			getWritingStyles( {
				writingBlocks,
				globalStyles,
				fontFamilies,
			} ).map( ( style ) => ( {
				...style,
				disabled: ! reachable.has( style.blockName ),
			} ) )
		);
	}, [ writingBlocks, transformItems, globalStyles, fontFamilies, name ] );

	const activeStyle = useMemo(
		() =>
			findActiveWritingStyle(
				groups.flatMap( ( group ) => group.styles ),
				name,
				attributes
			),
		[ groups, name, attributes ]
	);

	const customFontSize = attributes.style?.typography?.fontSize;

	const onSelectStyle = ( style: WritingStyle ) => {
		if ( style.blockName === name ) {
			if ( style.attributes ) {
				updateBlockAttributes( clientId, style.attributes );
			}
			return;
		}

		if ( ! block ) {
			return;
		}

		const transformed = switchToBlockType( block, style.blockName );

		if ( ! transformed ) {
			return;
		}

		/*
		 * The variation's attributes are applied to the transformed block
		 * rather than passed to `switchToBlockType`, whose `variationName`
		 * argument only matches a transform that declares that variation. The
		 * heading levels are block variations instead, so the block offers one
		 * transform from a paragraph and the level comes from the attributes.
		 */
		replaceBlocks(
			clientId,
			style.attributes
				? transformed.map( ( transformedBlock ) =>
						transformedBlock.name === style.blockName
							? {
									...transformedBlock,
									attributes: {
										...transformedBlock.attributes,
										...style.attributes,
									},
								}
							: transformedBlock
					)
				: transformed
		);
	};

	// A preset lives in its own attribute and a size of your own in `style`,
	// and the two are mutually exclusive.
	const setFontSize = ( {
		fontSize,
		customSize,
	}: {
		fontSize?: string;
		customSize?: string;
	} ) => {
		setAttributes( {
			fontSize,
			style: cleanEmptyObject( {
				...attributes.style,
				typography: {
					...attributes.style?.typography,
					fontSize: customSize,
				},
			} ),
		} );
	};

	const onStepFontSize = ( direction: number ) => {
		// A block that sets no size of its own still steps from the size it
		// renders at, which is the one its text style resolves to.
		const current =
			customFontSize ??
			fontSizes.find( ( preset ) => preset.slug === attributes.fontSize )
				?.size ??
			activeStyle?.fontSize;
		const stepped = getSteppedFontSize( current, fontSizes, direction );

		if ( stepped ) {
			setFontSize( { fontSize: stepped.slug } );
		}
	};

	return (
		<BlockControls group="writing">
			<WritingStyleDropdown
				groups={ groups }
				activeKey={ activeStyle?.key }
				onSelect={ onSelectStyle }
			/>
			<WritingFontDropdown
				fontFamilies={ fontFamilies }
				value={ attributes.fontFamily }
				onChange={ ( slug ) => setAttributes( { fontFamily: slug } ) }
			/>
			<WritingSizeDropdown
				fontSizes={ fontSizes }
				value={ attributes.fontSize }
				customSize={ customFontSize }
				onSelectPreset={ ( slug ) => setFontSize( { fontSize: slug } ) }
				onSetCustom={ ( size ) =>
					setFontSize( { customSize: `${ size }px` } )
				}
			/>
			<ToolbarGroup>
				<ToolbarButton
					icon={ chevronUp }
					label={ __( 'Increase size' ) }
					onClick={ () => onStepFontSize( 1 ) }
				/>
				<ToolbarButton
					icon={ chevronDown }
					label={ __( 'Decrease size' ) }
					onClick={ () => onStepFontSize( -1 ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}

const withWritingToolbar = createHigherOrderComponent(
	( BlockEdit: React.ComponentType< WritingToolbarProps > ) =>
		( props: WritingToolbarProps ) => (
			<>
				<BlockEdit key="edit" { ...props } />
				{ !! window.__experimentalWritingToolbar &&
					props.isSelected &&
					hasBlockSupport( props.name, 'writing', false ) && (
						<WritingToolbarControls { ...props } />
					) }
			</>
		),
	'withWritingToolbar'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/writing-toolbar',
	withWritingToolbar
);
