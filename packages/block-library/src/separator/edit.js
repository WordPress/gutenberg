/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { HorizontalRule } from '@wordpress/components';
import {
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/block-editor';

function SeparatorEdit( { color, setColor, className } ) {
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
				} }
			/>
			<InspectorControls>
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
