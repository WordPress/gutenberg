import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	hasBlockSupport,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type {
	FontFamilyPreset,
	FontSizePreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import {
	BlockControls,
	useSettings,
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

	/*
	 * Font sizes come back as one origin's worth, because a theme's sizes
	 * replace the default ones rather than adding to them. Font families are
	 * not treated that way, so they are gathered across the origins, as the
	 * typography inspector gathers them.
	 */
	const [ fontFamilyOrigins, fontSizePresets ] = useSettings(
		'typography.fontFamilies',
		'typography.fontSizes'
	) as [
		Record< string, FontFamilyPreset[] > | undefined,
		FontSizePreset[] | undefined,
	];
	const fontSizes: FontSizePreset[] = fontSizePresets ?? EMPTY_ARRAY;

	const fontFamilies = useMemo(
		() =>
			PRESET_ORIGINS.flatMap(
				( origin ) => fontFamilyOrigins?.[ origin ] ?? []
			),
		[ fontFamilyOrigins ]
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
				defaultName={ activeStyle?.fontFamilyName }
				onChange={ ( slug ) => setAttributes( { fontFamily: slug } ) }
			/>
			<WritingSizeDropdown
				fontSizes={ fontSizes }
				value={ attributes.fontSize }
				customSize={ customFontSize }
				defaultSize={ activeStyle?.fontSize }
				onSelectPreset={ ( slug ) => setFontSize( { fontSize: slug } ) }
				onSetCustom={ ( size ) =>
					setFontSize( { customSize: `${ size }px` } )
				}
			/>
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
