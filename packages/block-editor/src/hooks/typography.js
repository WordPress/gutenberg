/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import TextDecorationAndTransformEdit from '../components/text-decoration-and-transform';

import {
	LINE_HEIGHT_SUPPORT_KEY,
	LineHeightEdit,
	useIsLineHeightDisabled,
} from './line-height';
import {
	FONT_FAMILY_SUPPORT_KEY,
	FontFamilyEdit,
	useIsFontFamilyDisabled,
} from './font-family';
import {
	FONT_SIZE_SUPPORT_KEY,
	FontSizeEdit,
	useIsFontSizeDisabled,
} from './font-size';
import {
	TEXT_TRANSFORM_SUPPORT_KEY,
	useIsTextTransformDisabled,
} from './text-transform';

export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
];

export function TypographyPanel( props ) {
	const isDisabled = useIsTypographyDisabled( props );
	const isSupported = hasTypographySupport( props.name );

	if ( isDisabled || ! isSupported ) return null;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Typography' ) }>
				<FontFamilyEdit { ...props } />
				<FontSizeEdit { ...props } />
				<LineHeightEdit { ...props } />
				<TextDecorationAndTransformEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

const hasTypographySupport = ( blockName ) => {
	return (
		Platform.OS === 'web' &&
		TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
			hasBlockSupport( blockName, key )
		)
	);
};

function useIsTypographyDisabled( props = {} ) {
	const configs = [
		useIsFontSizeDisabled( props ),
		useIsLineHeightDisabled( props ),
		useIsFontFamilyDisabled( props ),
		useIsTextTransformDisabled( props ),
	];

	return configs.filter( Boolean ).length === configs.length;
}
