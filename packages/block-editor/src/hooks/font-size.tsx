import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { Block, BlockType } from '@wordpress/blocks';
import type { FontSizePreset } from '@wordpress/global-styles-engine';
import TokenList from '@wordpress/token-list';
import { getTypographyFontSizeValue } from '@wordpress/global-styles-engine';
import {
	getFontSize,
	getFontSizeClass,
	getFontSizeObjectByValue,
	FontSizePicker,
} from '../components/font-sizes';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';
import {
	cleanEmptyObject,
	transformStyles,
	shouldSkipSerialization,
} from './utils';
import { useSettings } from '../components/use-settings';
import type {
	BlockWrapperProps,
	FontSizeEditProps,
	FontSizeStyle,
} from './types';

export const FONT_SIZE_SUPPORT_KEY = 'typography.fontSize';

/**
 * Filters registered block settings, extending attributes to include
 * `fontSize` and `fontWeight` attributes.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
function addAttributes( settings: BlockType ): BlockType {
	if ( ! hasBlockSupport( settings, FONT_SIZE_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.fontSize ) {
		Object.assign( settings.attributes, {
			fontSize: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font size.
 *
 * @param props               Additional props applied to save element.
 * @param blockNameOrType     Block type.
 * @param attributes          Block attributes.
 * @param attributes.fontSize Font size preset slug.
 *
 * @return Filtered props applied to save element.
 */
function addSaveProps(
	props: BlockWrapperProps,
	blockNameOrType: BlockType | string,
	attributes: { fontSize?: string }
): BlockWrapperProps {
	if ( ! hasBlockSupport( blockNameOrType, FONT_SIZE_SUPPORT_KEY ) ) {
		return props;
	}

	if (
		shouldSkipSerialization(
			blockNameOrType,
			TYPOGRAPHY_SUPPORT_KEY,
			'fontSize'
		)
	) {
		return props;
	}

	// Use TokenList to dedupe classes.
	const classes = new TokenList( props.className );
	// Joining an unset class adds nothing.
	classes.add( getFontSizeClass( attributes.fontSize ) as string );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Inspector control panel containing the font size related configuration
 *
 * @param props
 *
 * @return Font size edit element.
 */
export function FontSizeEdit( props: FontSizeEditProps ) {
	const {
		attributes: { fontSize, style },
		setAttributes,
	} = props;
	const [ fontSizes ] = useSettings( 'typography.fontSizes' ) as [
		// The setting lists the font size presets.
		FontSizePreset[] | undefined,
	];

	const onChange = (
		value: number | string | undefined,
		selectedItem?: { slug?: string }
	) => {
		// Use the selectedItem's slug if available, otherwise fall back to finding by value
		const fontSizeSlug =
			selectedItem?.slug ||
			getFontSizeObjectByValue( fontSizes, value ).slug;

		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					fontSize: fontSizeSlug ? undefined : value,
				},
			} ),
			fontSize: fontSizeSlug,
		} );
	};

	const fontSizeObject = getFontSize(
		fontSizes,
		fontSize,
		style?.typography?.fontSize
	);

	const fontSizeValue =
		fontSizeObject?.size || style?.typography?.fontSize || fontSize;

	return (
		<FontSizePicker
			onChange={ onChange }
			value={ fontSize || fontSizeValue }
			valueMode={ fontSize ? 'slug' : 'literal' }
			withReset={ false }
			withSlider
		/>
	);
}

/**
 * Custom hook that checks if font-size settings have been disabled.
 *
 * @param props      Block props.
 * @param props.name The name of the block.
 * @return Whether setting is disabled.
 */
export function useIsFontSizeDisabled( {
	name: blockName,
}: { name?: string } = {} ) {
	const [ fontSizes ] = useSettings( 'typography.fontSizes' ) as [
		// The setting lists the font size presets.
		FontSizePreset[] | undefined,
	];
	const hasFontSizes = !! fontSizes?.length;

	return (
		// An unset block name has no support.
		! hasBlockSupport( blockName as string, FONT_SIZE_SUPPORT_KEY ) ||
		! hasFontSizes
	);
}

function useBlockProps( {
	name,
	fontSize,
	style,
}: {
	name: string;
	fontSize?: string;
	style?: FontSizeStyle;
} ) {
	const [ fontSizes, fluidTypographySettings, layoutSettings ] = useSettings(
		'typography.fontSizes',
		'typography.fluid',
		'layout'
	) as [
		// The settings hold the presets, fluid typography and layout settings.
		FontSizePreset[] | undefined,
		boolean | Record< string, unknown > | undefined,
		Record< string, unknown > | undefined,
	];

	/*
	 * Only add inline styles if the block supports font sizes,
	 * doesn't skip serialization of font sizes,
	 * and has either a custom font size or a preset font size.
	 */
	if (
		! hasBlockSupport( name, FONT_SIZE_SUPPORT_KEY ) ||
		shouldSkipSerialization( name, TYPOGRAPHY_SUPPORT_KEY, 'fontSize' ) ||
		( ! fontSize && ! style?.typography?.fontSize )
	) {
		return;
	}

	let props: BlockWrapperProps | undefined;

	if ( style?.typography?.fontSize ) {
		props = {
			style: {
				fontSize: getTypographyFontSizeValue(
					// It reads only the preset size.
					{ size: style.typography.fontSize } as FontSizePreset,
					{
						typography: {
							fluid: fluidTypographySettings,
						},
						layout: layoutSettings,
					}
				),
			},
		};
	}

	if ( fontSize ) {
		props = {
			style: {
				fontSize: getFontSize(
					fontSizes,
					fontSize,
					style?.typography?.fontSize
				).size,
			},
		};
	}

	if ( ! props ) {
		return;
	}

	return addSaveProps( props, name, { fontSize } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fontSize', 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, FONT_SIZE_SUPPORT_KEY );
	},
};

const MIGRATION_PATHS = {
	fontSize: [ [ 'fontSize' ], [ 'style', 'typography', 'fontSize' ] ],
};

function addTransforms(
	result: Block,
	source: Block[],
	index: number,
	results: Block[]
) {
	const destinationBlockType = result.name;
	const activeSupports = {
		fontSize: hasBlockSupport(
			destinationBlockType,
			FONT_SIZE_SUPPORT_KEY
		),
	};
	return transformStyles(
		activeSupports,
		MIGRATION_PATHS,
		result,
		source,
		index,
		results
	);
}

addFilter(
	'blocks.registerBlockType',
	'core/font/addAttribute',
	addAttributes
);

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/font-size/addTransforms',
	addTransforms
);
