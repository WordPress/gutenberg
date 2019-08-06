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

/**
 * Internal dependencies
 */
import getActiveStyle from './getActiveStyle';
import { settings } from './index';

function SeparatorEdit( { color, setColor, className, attributes, setAttributes } ) {
	const { dotSize, dotSpacing, lineThickness } = attributes;
	const currentStyle = getActiveStyle( settings.styles, className ).name;
	const isDots = currentStyle === 'dots';
	const isLine = currentStyle === 'wide' || currentStyle === 'default';
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
					fontSize: dotSize,
					letterSpacing: dotSpacing || dotSize,
					paddingLeft: ( isDots ? ( dotSpacing || dotSize ) : '' ),
					borderWidth: lineThickness,
					height: lineThickness,
				} }
			/>
			<InspectorControls>
				{ isDots && <PanelBody title={ __( 'Dots Settings' ) }>
					<RangeControl
						label={ __( 'Dot Size' ) }
						value={ dotSize || 20 }
						onChange={ ( nextSize ) => {
							setAttributes( { dotSize: nextSize } );
						} }
						allowReset
					/>
					<RangeControl
						label={ __( 'Dot Spacing' ) }
						value={ dotSpacing || 20 }
						onChange={ ( nextSize ) => {
							setAttributes( { dotSpacing: nextSize } );
						} }
						allowReset
					/>
				</PanelBody> }
				{ isLine && <PanelBody title={ __( 'Line Settings' ) }>
					<RangeControl
						label={ __( 'Line Thickness' ) }
						value={ lineThickness || 2 }
						onChange={ ( nextSize ) => {
							setAttributes( { lineThickness: nextSize } );
						} }
						allowReset
					/>
				</PanelBody> }
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
