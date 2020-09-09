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

import {
	LineHeightEdit,
	useIsLineHeightDisabled,
	LINE_HEIGHT_SUPPORT_KEY,
} from './line-height';
import {
	FontSizeEdit,
	useIsFontSizeDisabled,
	FONT_SIZE_SUPPORT_KEY,
} from './font-size';

export { FONT_SIZE_SUPPORT_KEY, LINE_HEIGHT_SUPPORT_KEY };

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
	return (
		Platform.OS === 'web' &&
		[ FONT_SIZE_SUPPORT_KEY, LINE_HEIGHT_SUPPORT_KEY ].some( ( key ) =>
			hasBlockSupport( blockName, key )
		)
	);
};

function useIsTypographyDisabled( props = {} ) {
	const configs = [
		useIsFontSizeDisabled( props ),
		useIsLineHeightDisabled( props ),
	];

	return configs.filter( Boolean ).length === configs.length;
}
