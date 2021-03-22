/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { CSS_UNITS } from './shared';

const SeparatorSettings = ( {
	color,
	setColor,
	attributes: { style },
	setAttributes,
} ) => {
	const updateMargins = ( { top, bottom } ) => {
		setAttributes( {
			style: {
				...style,
				spacing: {
					...style?.spacing,
					margin: { top, bottom },
				},
			},
		} );
	};

	const onChangeShowVisualizer = ( { top, bottom } ) => {
		setAttributes( {
			style: {
				...style,
				visualizers: {
					margin: { top, bottom },
				},
			},
		} );
	};

	return (
		<InspectorControls>
			<PanelColorSettings
				title={ __( 'Color settings' ) }
				colorSettings={ [
					{
						value: color.color,
						onChange: setColor,
						label: __( 'Color' ),
					},
				] }
			/>
			<PanelBody title={ __( 'Separator settings' ) }>
				<BoxControl
					label={ __( 'Margin' ) }
					onChange={ updateMargins }
					sides={ {
						top: true,
						right: false,
						bottom: true,
						left: false,
					} }
					units={ CSS_UNITS }
					values={ style?.spacing?.margin || {} }
					onChangeShowVisualizer={ onChangeShowVisualizer }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default SeparatorSettings;
