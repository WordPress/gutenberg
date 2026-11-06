import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import {
	ColorIndicator,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import type {
	FontFamilyPreset,
	FontSizePreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import {
	BlockControls,
	useSettings,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import clearFormattingIcon from './clear-formatting-icon';
import { unlock } from '../../lock-unlock';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import TypographyFontDropdown from './font-dropdown';
import TypographySizeDropdown from './size-dropdown';
import TypographyColorDropdown from './color-dropdown';
import TextColorIcon from './text-color-icon';
import {
	clearedTypography,
	getFontDisplayName,
	hasOwnTypography,
	resolveBlockTypography,
} from './utils';

declare global {
	interface Window {
		/**
		 * Whether the typography toolbar experiment is enabled.
		 */
		__experimentalTypographyToolbar?: boolean;
	}
}

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const PRESET_ORIGINS = [ 'default', 'theme', 'custom' ] as const;
const EMPTY_ARRAY: never[] = [];

const FONT_FAMILY_SUPPORT = 'typography.__experimentalFontFamily';
const FONT_SIZE_SUPPORT = 'typography.fontSize';

type ColorOption = { slug?: string; name?: string; color: string };

/**
 * Whether a block lets one of its colours be set. The colour support flags
 * each feature, and these two are on unless they are turned off.
 *
 * @param name    The block's name.
 * @param feature Which colour to ask about.
 *
 * @return Whether the block offers that colour.
 */
function hasColorSupport(
	name: string,
	feature: 'text' | 'background'
): boolean {
	const support = getBlockSupport( name, 'color' ) as
		Record< string, boolean | undefined > | boolean | undefined;

	if ( ! support ) {
		return false;
	}

	return support === true || support[ feature ] !== false;
}

type TypographyAttributes = {
	fontFamily?: string;
	fontSize?: string;
	textColor?: string;
	backgroundColor?: string;
	// A heading's level decides which element it takes its typography from.
	level?: unknown;
	style?: {
		color?: { text?: string; background?: string };
		typography?: { fontSize?: string };
	};
	[ key: string ]: unknown;
};

type TypographyToolbarProps = {
	name: string;
	isSelected: boolean;
	attributes: TypographyAttributes;
	setAttributes: ( attributes: Partial< TypographyAttributes > ) => void;
};

function TypographyToolbarControls( {
	name,
	attributes,
	setAttributes,
}: TypographyToolbarProps ) {
	// The hook is still JavaScript, so its shape is asserted here.
	const { merged: globalStyles } = useGlobalStyles() as {
		merged: GlobalStylesConfig;
	};

	/*
	 * Font sizes come back as one origin's worth, because a theme's sizes
	 * replace the default ones rather than adding to them. Font families are
	 * not treated that way, so they are gathered across the origins, as the
	 * typography inspector gathers them.
	 */
	const [ fontFamilyOrigins, fontSizePresets, colorPalette ] = useSettings(
		'typography.fontFamilies',
		'typography.fontSizes',
		'color.palette'
	) as [
		Record< string, FontFamilyPreset[] > | undefined,
		FontSizePreset[] | undefined,
		ColorOption[] | undefined,
	];
	const colors: ColorOption[] = colorPalette ?? EMPTY_ARRAY;
	const fontSizes: FontSizePreset[] = fontSizePresets ?? EMPTY_ARRAY;

	const fontFamilies = useMemo(
		() =>
			PRESET_ORIGINS.flatMap(
				( origin ) => fontFamilyOrigins?.[ origin ] ?? []
			),
		[ fontFamilyOrigins ]
	);

	// What the block renders with when it sets nothing of its own, so the
	// toolbar names the font and size in front of you rather than saying
	// nothing until you change them.
	const inherited = useMemo(
		() => resolveBlockTypography( globalStyles, name, attributes ),
		[ globalStyles, name, attributes ]
	);

	const hasFont = hasBlockSupport( name, FONT_FAMILY_SUPPORT, false );
	const hasSize = hasBlockSupport( name, FONT_SIZE_SUPPORT, false );
	const hasTextColor = hasColorSupport( name, 'text' );
	const hasBackground = hasColorSupport( name, 'background' );
	const customFontSize = attributes.style?.typography?.fontSize;

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

	// A preset lives in its own attribute and a colour of your own in `style`.
	const setColor = (
		attribute: 'textColor' | 'backgroundColor',
		styleKey: 'text' | 'background',
		color?: string,
		slug?: string
	) => {
		setAttributes( {
			[ attribute ]: slug,
			style: cleanEmptyObject( {
				...attributes.style,
				color: {
					...attributes.style?.color,
					[ styleKey ]: slug ? undefined : color,
				},
			} ),
		} );
	};

	const colorInUse = ( slug?: string, custom?: string ) =>
		slug ? colors.find( ( color ) => color.slug === slug )?.color : custom;

	const textColor = colorInUse(
		attributes.textColor,
		attributes.style?.color?.text
	);
	const backgroundColor = colorInUse(
		attributes.backgroundColor,
		attributes.style?.color?.background
	);

	return (
		<BlockControls group="typography">
			{ hasFont && (
				<TypographyFontDropdown
					fontFamilies={ fontFamilies }
					value={ attributes.fontFamily }
					defaultName={ getFontDisplayName(
						inherited.fontFamily,
						fontFamilies
					) }
					onChange={ ( slug ) =>
						setAttributes( { fontFamily: slug } )
					}
				/>
			) }
			{ hasSize && (
				<TypographySizeDropdown
					fontSizes={ fontSizes }
					value={ attributes.fontSize }
					customSize={ customFontSize }
					defaultSize={ inherited.fontSize }
					onSelectPreset={ ( slug ) =>
						setFontSize( { fontSize: slug } )
					}
					onSetCustom={ ( size ) =>
						setFontSize( { customSize: `${ size }px` } )
					}
				/>
			) }
			{ hasTextColor && (
				<TypographyColorDropdown
					label={ __( 'Text color' ) }
					icon={
						<TextColorIcon
							color={ textColor ?? inherited.textColor }
						/>
					}
					colors={ colors }
					value={ textColor }
					onChange={ ( color, slug ) =>
						setColor( 'textColor', 'text', color, slug )
					}
				/>
			) }
			{ hasBackground && (
				<TypographyColorDropdown
					label={ __( 'Background color' ) }
					icon={ <ColorIndicator colorValue={ backgroundColor } /> }
					colors={ colors }
					value={ backgroundColor }
					onChange={ ( color, slug ) =>
						setColor( 'backgroundColor', 'background', color, slug )
					}
				/>
			) }
			{ hasOwnTypography( attributes ) && (
				<ToolbarGroup>
					<ToolbarButton
						icon={ clearFormattingIcon }
						label={ __( 'Clear formatting' ) }
						onClick={ () =>
							setAttributes( clearedTypography( attributes ) )
						}
					/>
				</ToolbarGroup>
			) }
		</BlockControls>
	);
}

const withTypographyToolbar = createHigherOrderComponent(
	( BlockEdit: React.ComponentType< TypographyToolbarProps > ) =>
		( props: TypographyToolbarProps ) => {
			const offersTypography =
				hasBlockSupport( props.name, FONT_FAMILY_SUPPORT, false ) ||
				hasBlockSupport( props.name, FONT_SIZE_SUPPORT, false ) ||
				hasColorSupport( props.name, 'text' ) ||
				hasColorSupport( props.name, 'background' );

			return (
				<>
					<BlockEdit key="edit" { ...props } />
					{ !! window.__experimentalTypographyToolbar &&
						props.isSelected &&
						offersTypography && (
							<TypographyToolbarControls { ...props } />
						) }
				</>
			);
		},
	'withTypographyToolbar'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/typography-toolbar',
	withTypographyToolbar
);
