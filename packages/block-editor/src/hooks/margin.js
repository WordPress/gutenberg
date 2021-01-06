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
import { SPACING_SUPPORT_KEY } from './padding';
import useEditorFeature from '../components/use-editor-feature';

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

	const customUnits = useEditorFeature( 'spacing.units' );
	const units = customUnits?.map( ( unit ) => ( {
		value: unit,
		label: unit,
	} ) );

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
					type="margin"
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}
