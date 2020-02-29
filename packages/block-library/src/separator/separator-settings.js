/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { compose, withInstanceId } from '@wordpress/compose';
import { BaseControl, PanelBody } from '@wordpress/components';

const MINIMUM_HEIGHT = 20;

const SeparatorSettings = ( {
	color,
	height,
	instanceId,
	setColor,
	setInputHeightValue,
	setAttributes,
} ) => {
	const id = `block-spacer-height-input-${ instanceId }`;
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
			></PanelColorSettings>
			<PanelBody title={ __( 'Size settings' ) }>
				<BaseControl
					id={ id }
					label={ __( 'Empty vertical space in pixels' ) }
				>
					<input
						type="number"
						id={ id }
						onChange={ ( event ) => {
							let spacerHeight = parseInt(
								event.target.value,
								10
							);
							setInputHeightValue( spacerHeight );
							if ( isNaN( spacerHeight ) ) {
								// Set spacer height to default size and input box to empty string
								setInputHeightValue( '' );
								spacerHeight = MINIMUM_HEIGHT;
							} else if ( spacerHeight < MINIMUM_HEIGHT ) {
								// Set spacer height to minimum size
								setInputHeightValue( MINIMUM_HEIGHT );
								spacerHeight = MINIMUM_HEIGHT;
							}
							setAttributes( {
								height: spacerHeight,
							} );
						} }
						value={ height }
						min={ MINIMUM_HEIGHT }
						step="10"
					/>
				</BaseControl>
			</PanelBody>
		</InspectorControls>
	);
};

export default compose( [ withInstanceId ] )( SeparatorSettings );
