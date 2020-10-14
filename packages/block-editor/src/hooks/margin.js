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
import { SPACING_SUPPORT_KEY } from './padding';

const hasMarginSupport = ( blockName ) => {
	const spacingSupport = getBlockSupport( blockName, SPACING_SUPPORT_KEY );
	return spacingSupport && spacingSupport.margin;
};

/**
 * Inspector control panel containing the line height related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Line height edit element.
 */
export function MarginEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
	} = props;

	const units = useCustomUnits();

	if ( ! hasMarginSupport( blockName ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const spacing = style && style.spacing;
		const newStyle = {
			...style,
			spacing: {
				...spacing,
				margin: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const onChangeShowVisualizer = ( next ) => {
		const spacing = style && style.visualizers;
		const newStyle = {
			...style,
			visualizers: {
				...spacing,
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
