import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';
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

type TypographyAttributes = {
	fontFamily?: string;
	fontSize?: string;
	// A heading's level decides which element it takes its typography from.
	level?: unknown;
	style?: { typography?: { fontSize?: string } };
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

	// What the block renders with when it sets nothing of its own, so the
	// toolbar names the font and size in front of you rather than saying
	// nothing until you change them.
	const inherited = useMemo(
		() => resolveBlockTypography( globalStyles, name, attributes ),
		[ globalStyles, name, attributes ]
	);

	const hasFont = hasBlockSupport( name, FONT_FAMILY_SUPPORT, false );
	const hasSize = hasBlockSupport( name, FONT_SIZE_SUPPORT, false );
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
		</BlockControls>
	);
}

const withTypographyToolbar = createHigherOrderComponent(
	( BlockEdit: React.ComponentType< TypographyToolbarProps > ) =>
		( props: TypographyToolbarProps ) => {
			const offersTypography =
				hasBlockSupport( props.name, FONT_FAMILY_SUPPORT, false ) ||
				hasBlockSupport( props.name, FONT_SIZE_SUPPORT, false );

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
