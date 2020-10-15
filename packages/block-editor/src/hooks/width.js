/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import InspectorControls from '../components/inspector-controls';
import useEditorFeature from '../components/use-editor-feature';
import WidthControl from '../components/width-control';

/**
 * Key within block settings' supports array indicating support for
 * width, e.g. settings found in 'block.json'.
 */
export const WIDTH_SUPPORT_KEY = '__experimentalWidth';

export function WidthPanel( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const widthOptions = useEditorFeature( 'width' );
	const isDisabled = useIsWidthDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const selectedWidth = getWidthFromAttributeValue(
		widthOptions,
		style?.width
	);

	function onChange( newWidth ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				width: newWidth,
			} ),
		} );
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Width Settings' ) }>
				<WidthControl
					value={ selectedWidth }
					widthOptions={ widthOptions }
					onChange={ onChange }
				/>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Checks if width support has been disabled
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function useIsWidthDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport( blockName, WIDTH_SUPPORT_KEY );

	const widthOptions = useEditorFeature( 'width' );
	const hasWidthOptions = !! widthOptions?.length;

	return notSupported || ! hasWidthOptions;
}

/**
 * Extracts the current width selection, if available, from the CSS variable
 * set as the 'styles.width' attribute.
 *
 * @param {Array} widthOptions Available width options as defined in theme.json
 * @param {string} value       Attribute value in `styles.width`
 * @return {string}            Actual width value
 */
const getWidthFromAttributeValue = ( widthOptions, value ) => {
	const attributeParsed = /var:preset\|width\|(.+)/.exec( value );

	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return widthOptions.find(
			( { slug } ) => slug === attributeParsed[ 1 ]
		)?.slug;
	}

	return value;
};
