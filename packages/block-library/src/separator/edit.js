/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { HorizontalRule, RangeControl, PanelBody } from '@wordpress/components';
import {
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/block-editor';

function SeparatorEdit( { color, setColor, className, attributes, setAttributes } ) {
	const { width = 25 } = attributes;
	return (
		<>
			<HorizontalRule
				className={ classnames(
					className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					}
				) }
				style={ {
					backgroundColor: color.color,
					color: color.color,
					width: width + '%',
				} }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Separator Settings' ) }>
					<RangeControl
						label={ __( 'Percentage width' ) }
						value={ width || '' }
						onChange={ ( nextWidth ) => {
							setAttributes( { width: nextWidth } );
						} }
						min={ 1 }
						max={ 100 }
						required
						allowReset
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: color.color,
							onChange: setColor,
							label: __( 'Color' ),
						},
					] }
				>
				</PanelColorSettings>
			</InspectorControls>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
