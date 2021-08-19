/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import useSetting from '../components/use-setting';
import useConsolidatedStyles from '../components/use-consolidated-styles';
import { BorderColorEdit } from './border-color';
import { BorderRadiusEdit } from './border-radius';
import { BorderStyleEdit } from './border-style';
import { BorderWidthEdit } from './border-width';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

export function BorderPanel( props ) {
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( props.name );

	const isColorSupported =
		useSetting( 'border.customColor' ) &&
		hasBorderSupport( props.name, 'color' );

	const isRadiusSupported =
		useSetting( 'border.customRadius' ) &&
		hasBorderSupport( props.name, 'radius' );

	const isStyleSupported =
		useSetting( 'border.customStyle' ) &&
		hasBorderSupport( props.name, 'style' );

	const isWidthSupported =
		useSetting( 'border.customWidth' ) &&
		hasBorderSupport( props.name, 'width' );

	// TODO
	// This is an example targeted at border for now while testing.
	// We could consolidate at the highest level: packages/block-editor/src/hooks/style.js
	const consolidatedStyles = useConsolidatedStyles(
		props.attributes?.style,
		'border'
	);

	// TODO abstract this to the hook?
	// TODO We'll have to revisit defaults here.
	// E.g., if the user removes a value from the post editor, what does that mean?
	// Do we automatically default to the global style value, or do we interpret empty as `0` for border width for example?
	// At which point do we reinstate the global style value?
	const mergedProps = {
		...props,
		attributes: {
			...props.attributes,
			style: {
				...consolidatedStyles,
			},
		},
	};

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				className="block-editor-hooks__border-controls"
				title={ __( 'Border' ) }
				initialOpen={ false }
			>
				{ ( isWidthSupported || isStyleSupported ) && (
					<div className="block-editor-hooks__border-controls-row">
						{ isWidthSupported && (
							<BorderWidthEdit { ...mergedProps } />
						) }
						{ isStyleSupported && (
							<BorderStyleEdit { ...mergedProps } />
						) }
					</div>
				) }
				{ isColorSupported && <BorderColorEdit { ...mergedProps } /> }
				{ isRadiusSupported && <BorderRadiusEdit { ...mergedProps } /> }
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Border feature to check support for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBorderSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! (
			support?.color ||
			support?.radius ||
			support?.width ||
			support?.style
		);
	}

	return !! support?.[ feature ];
}

/**
 * Check whether serialization of border classes and styles should be skipped.
 *
 * @param {string|Object} blockType Block name or block type object.
 *
 * @return {boolean} Whether serialization of border properties should occur.
 */
export function shouldSkipSerialization( blockType ) {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );

	return support?.__experimentalSkipSerialization;
}

/**
 * Determines if all border support features have been disabled.
 *
 * @return {boolean} If border support is completely disabled.
 */
const useIsBorderDisabled = () => {
	const configs = [
		! useSetting( 'border.customColor' ),
		! useSetting( 'border.customRadius' ),
		! useSetting( 'border.customStyle' ),
		! useSetting( 'border.customWidth' ),
	];

	return configs.every( Boolean );
};
