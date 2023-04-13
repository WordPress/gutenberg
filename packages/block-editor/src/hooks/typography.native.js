/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
/**
 * External dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';

import {
	LINE_HEIGHT_SUPPORT_KEY,
	LineHeightEdit,
	useIsLineHeightDisabled,
} from './line-height';
import {
	FONT_SIZE_SUPPORT_KEY,
	FontSizeEdit,
	useIsFontSizeDisabled,
} from './font-size';

export const TYPOGRAPHY_SUPPORT_KEY = 'typography';
export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
];

export function TypographyPanel( props ) {
	const isDisabled = useIsTypographyDisabled( props );
	const isSupported = hasTypographySupport( props.name );

	if ( isDisabled || ! isSupported ) return null;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Typography' ) }>
				<FontSizeEdit { ...props } />
				<LineHeightEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};

function useIsTypographyDisabled( props = {} ) {
	const configs = [
		useIsFontSizeDisabled( props ),
		useIsLineHeightDisabled( props ),
	];

	return configs.filter( Boolean ).length === configs.length;
}
