/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
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
import { store as blockEditorStore } from '../store';
import {
	getTypographyFontSizeValue,
	getFluidTypographyOptionsFromSettings,
} from '../components/global-styles/typography-utils';

export const FONT_SIZE_SUPPORT_KEY = 'typography.fontSize';

/**
 * Filters registered block settings, extending attributes to include
 * `fontSize` and `fontWeight` attributes.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! settings.supports?.[ FONT_SIZE_SUPPORT_KEY ] ) {
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
 * @param {Object} props           Additional props applied to save element.
 * @param {Object} blockNameOrType Block type.
 * @param {Object} attributes      Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
function addSaveProps( props, blockNameOrType, attributes ) {
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
	classes.add( getFontSizeClass( attributes.fontSize ) );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Inspector control panel containing the font size related configuration
 *
 * @param {Object} props
 *
 * @return {Element} Font size edit element.
 */
export function FontSizeEdit( props ) {
	const {
		attributes: { fontSize, style },
		setAttributes,
	} = props;
	const [ fontSizes ] = useSettings( 'typography.fontSizes' );

	const onChange = ( value ) => {
		const fontSizeSlug = getFontSizeObjectByValue( fontSizes, value ).slug;

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
			value={ fontSizeValue }
			withReset={ false }
			withSlider
			size="__unstable-large"
			__nextHasNoMarginBottom
		/>
	);
}

/**
 * Custom hook that checks if font-size settings have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontSizeDisabled( { name: blockName } = {} ) {
	const [ fontSizes ] = useSettings( 'typography.fontSizes' );
	const hasFontSizes = !! fontSizes?.length;

	return (
		! hasBlockSupport( blockName, FONT_SIZE_SUPPORT_KEY ) || ! hasFontSizes
	);
}

function useBlockProps( { name, fontSize, style } ) {
	const [ fontSizes ] = useSettings( 'typography.fontSizes' );

	// Only add inline styles if the block supports font sizes,
	// doesn't skip serialization of font sizes,
	// doesn't already have an inline font size,
	// and does have a class to extract the font size from.
	if (
		! hasBlockSupport( name, FONT_SIZE_SUPPORT_KEY ) ||
		shouldSkipSerialization( name, TYPOGRAPHY_SUPPORT_KEY, 'fontSize' ) ||
		! fontSize
	) {
		return;
	}

	let props = {};

	if ( ! style?.typography?.fontSize ) {
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

	// TODO: This sucks! We should be using useSetting( 'typography.fluid' )
	// or even useSelect( blockEditorStore ). We can't do either here
	// because getEditWrapperProps is a plain JavaScript function called by
	// BlockListBlock and not a React component rendered within
	// BlockListContext.Provider. If we set fontSize using editor.
	// BlockListBlock instead of using getEditWrapperProps then the value is
	// clobbered when the core/style/addEditProps filter runs.

	// TODO: We can do the thing above now.
	const fluidTypographySettings = getFluidTypographyOptionsFromSettings(
		select( blockEditorStore ).getSettings().__experimentalFeatures
	);

	if ( fontSize ) {
		props = {
			style: {
				fontSize: getTypographyFontSizeValue(
					{ size: fontSize },
					fluidTypographySettings
				),
			},
		};
	}

	return addSaveProps( props, name, { fontSize } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fontSize', 'style' ],
	hasSupport( supports ) {
		return !! supports[ FONT_SIZE_SUPPORT_KEY ];
	},
};

const MIGRATION_PATHS = {
	fontSize: [ [ 'fontSize' ], [ 'style', 'typography', 'fontSize' ] ],
};

function addTransforms( result, source, index, results ) {
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
