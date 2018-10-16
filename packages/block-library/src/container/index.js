/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFallbackStyles } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	getColorClassName,
	withColors,
	ContrastChecker,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps.attributes;

	return {
		fallbackBackgroundColor: backgroundColor,
		fallbackTextColor: textColor,
	};
} );

export const name = 'core/container';

export const settings = {
	title: __( 'Container' ),

	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z" /><path d="M0 0h24v24H0z" fill="none" /></svg>,

	category: 'layout',

	attributes: {
		align: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		customTextColor: {
			type: 'string',
		},
	},

	description: __( 'Group blocks into a container.' ),

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
	},

	edit: compose( [
		withColors( 'backgroundColor', { textColor: 'color' } ),
		applyFallbackStyles,
	] )( ( props ) => {
		const {
			backgroundColor,
			className,
			fallbackBackgroundColor,
			fallbackTextColor,
			setBackgroundColor,
			setTextColor,
			textColor,
		} = props;

		return (
			<Fragment>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background Color' ),
							},
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Text Color' ),
							},
						] }
					>
						<ContrastChecker
							{ ...{
								textColor: textColor.color,
								backgroundColor: backgroundColor.color,
								fallbackTextColor,
								fallbackBackgroundColor,
							} }
						/>
					</PanelColorSettings>
				</InspectorControls>
				<div
					className={ classnames( className, {
						'has-background': backgroundColor.color,
						'has-text-color': textColor.color,
						[ backgroundColor.class ]: backgroundColor.class,
						[ textColor.class ]: textColor.class,
					} ) }
					style={ {
						backgroundColor: backgroundColor.color,
						color: textColor.color,
					} }
				>
					<InnerBlocks />
				</div>
			</Fragment>
		);
	} ),

	save( { attributes } ) {
		const {
			backgroundColor,
			customBackgroundColor,
			customTextColor,
			textColor,
		} = attributes;

		const backgroundColorClass = getColorClassName( 'background-color', backgroundColor );
		const textColorClass = getColorClassName( 'color', textColor );

		return (
			<div
				className={ classnames( {
					'has-background': backgroundColor || customBackgroundColor,
					'has-text-color': textColor || customTextColor,
					[ backgroundColorClass ]: backgroundColorClass,
					[ textColorClass ]: textColorClass,
				} ) }
				style={ {
					backgroundColor: backgroundColorClass ? undefined : customBackgroundColor,
					color: textColorClass ? undefined : customTextColor,
				} }
			>
				<InnerBlocks.Content />
			</div>
		);
	},
};
