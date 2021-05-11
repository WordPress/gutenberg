/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import { SPACING_SUPPORT_KEY, useCustomSides } from './spacing';
import { cleanEmptyObject } from './utils';
import { useCustomUnits } from '../components/unit-control';

/**
 * Determines if there is margin support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasMarginSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.margin );
}

/**
 * Custom hook that checks if margin settings have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}     Whether margin setting is disabled.
 */
export function useIsMarginDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useEditorFeature( 'spacing.customMargin' );
	return ! hasMarginSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the margin related configuration
 *
 * @param  {Object} props Block props.
 * @return {WPElement}    Margin edit element.
 */
export function MarginEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
	} = props;

	const units = useCustomUnits();
	const sides = useCustomSides( blockName, 'margin' );

	if ( ! hasMarginSupport( blockName ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				margin: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const onChangeShowVisualizer = ( next ) => {
		const newStyle = {
			...style,
			visualizers: {
				margin: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				<BoxControl
					values={ style?.spacing?.margin }
					onChange={ onChange }
					onChangeShowVisualizer={ onChangeShowVisualizer }
					label={ __( 'Margin' ) }
					sides={ sides }
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}
