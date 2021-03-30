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
import { cleanEmptyObject } from './utils';
import { useCustomUnits } from '../components/unit-control';
import useEditorFeature from '../components/use-editor-feature';

const SPACING_SUPPORT_KEY = 'spacing';

const hasMarginSupport = ( blockName ) => {
	const spacingSupport = getBlockSupport( blockName, SPACING_SUPPORT_KEY );
	return spacingSupport && spacingSupport.margin !== false;
};

/**
 * Inspector control panel containing the margin related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Margin edit element.
 */
export function MarginEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
	} = props;

	const supportsMargin = useEditorFeature( 'spacing.customMargin' );
	const units = useCustomUnits();

	if ( ! supportsMargin || ! hasMarginSupport( blockName ) ) {
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
				...style?.visualizers,
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
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}
