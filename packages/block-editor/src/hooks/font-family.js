/**
 * External dependencies
 */
import { find, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import FontFamilyControl from '../components/font-family';

export const FONT_FAMILY_SUPPORT_KEY = 'typography.__experimentalFontFamily';

/**
 * Filters registered block settings, extending attributes to include
 * the `fontFamily` attribute.
 *
 * @param {Object} settings Original block settings
 * @return {Object}         Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, FONT_FAMILY_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.fontFamily ) {
		Object.assign( settings.attributes, {
			fontFamily: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font family.
 *
 * @param {Object} props      Additional props applied to save element
 * @param {Object} blockType  Block type
 * @param {Object} attributes Block attributes
 * @return {Object}           Filtered props applied to save element
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FONT_FAMILY_SUPPORT_KEY ) ) {
		return props;
	}

	if (
		hasBlockSupport(
			blockType,
			'typography.__experimentalSkipSerialization'
		)
	) {
		return props;
	}

	if ( ! attributes?.fontFamily ) {
		return props;
	}

	// Use TokenList to dedupe classes.
	const classes = new TokenList( props.className );
	classes.add( `has-${ kebabCase( attributes?.fontFamily ) }-font-family` );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Filters registered block settings to expand the block edit wrapper
 * by applying the desired styles and classnames.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addEditProps( settings ) {
	if ( ! hasBlockSupport( settings, FONT_FAMILY_SUPPORT_KEY ) ) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};
		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}
		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

export function FontFamilyEdit( {
	setAttributes,
	attributes: { fontFamily },
} ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );

	const value = find( fontFamilies, ( { slug } ) => fontFamily === slug )
		?.fontFamily;

	function onChange( newValue ) {
		const predefinedFontFamily = find(
			fontFamilies,
			( { fontFamily: f } ) => f === newValue
		);
		setAttributes( {
			fontFamily: predefinedFontFamily?.slug,
		} );
	}

	return (
		<FontFamilyControl
			className="block-editor-hooks-font-family-control"
			fontFamilies={ fontFamilies }
			value={ value }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if font-family functionality is disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontFamilyDisabled( { name } ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	return (
		! fontFamilies ||
		fontFamilies.length === 0 ||
		! hasBlockSupport( name, FONT_FAMILY_SUPPORT_KEY )
	);
}

/**
 * Checks if there is a current value set for the font family block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a font family value set.
 */
export function hasFontFamilyValue( props ) {
	return !! props.attributes.fontFamily;
}

/**
 * Resets the font family block support attribute. This can be used when
 * disabling the font family support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetFontFamily( { setAttributes } ) {
	setAttributes( { fontFamily: undefined } );
}

addFilter(
	'blocks.registerBlockType',
	'core/fontFamily/addAttribute',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/fontFamily/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/fontFamily/addEditProps',
	addEditProps
);
