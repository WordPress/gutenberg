import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
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
import { unlock } from '../../lock-unlock';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import TypographyFontDropdown from './font-dropdown';
import TypographySizeDropdown from './size-dropdown';
import TypographyColorDropdown from './color-dropdown';
import { getFontDisplayName, resolveBlockTypography } from './utils';

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
 * Whether a block lets its text be coloured. The colour support flags each
 * feature, and text is the one that is on unless it is turned off.
 *
 * @param name The block's name.
 *
 * @return Whether the block offers a text colour.
 */
function hasTextColorSupport( name: string ): boolean {
	const support = getBlockSupport( name, 'color' ) as
		{ text?: boolean } | boolean | undefined;

	if ( ! support ) {
		return false;
	}

	return support === true || support.text !== false;
}

type TypographyAttributes = {
	fontFamily?: string;
	fontSize?: string;
	textColor?: string;
	// A heading's level decides which element it takes its typography from.
	level?: unknown;
	style?: {
		color?: { text?: string };
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
	const hasColor = hasTextColorSupport( name );
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

	// A preset lives in `textColor` and a colour of your own in `style`.
	const onChangeColor = ( color?: string, slug?: string ) => {
		setAttributes( {
			textColor: slug,
			style: cleanEmptyObject( {
				...attributes.style,
				color: {
					...attributes.style?.color,
					text: slug ? undefined : color,
				},
			} ),
		} );
	};

	const activeColor = attributes.textColor
		? colors.find( ( color ) => color.slug === attributes.textColor )?.color
		: attributes.style?.color?.text;

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
			{ hasColor && (
				<TypographyColorDropdown
					colors={ colors }
					value={ activeColor }
					defaultColor={ inherited.textColor }
					onChange={ onChangeColor }
				/>
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
				hasTextColorSupport( props.name );

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
