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

import { LINE_HEIGHT_SUPPORT_KEY, LineHeightEdit } from './line-height';
import { FONT_SIZE_SUPPORT_KEY, FontSizeEdit } from './font-size';

export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
];

export function TypographyPanel( props ) {
	const { name: blockName } = props;
	const hasTypographySupport = TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);

	const contentMarkup = (
		<>
			<FontSizeEdit { ...props } />
			<LineHeightEdit { ...props } />
		</>
	);
	const hasContent = !! contentMarkup;
	const shouldRender =
		Platform.OS === 'web' && hasTypographySupport && hasContent;

	if ( ! shouldRender ) return null;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Typography' ) }>
				{ contentMarkup }
			</PanelBody>
		</InspectorControls>
	);
}
