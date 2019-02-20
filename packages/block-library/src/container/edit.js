/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';

function ContainerEdit( { className, setBackgroundColor, backgroundColor, setAttributes, attributes } ) {
	const { isWithPadding } = attributes;

	const styles = {
		backgroundColor: backgroundColor.color,
	};

	const classes = classnames( className, backgroundColor.class, {
		'is-with-padding': isWithPadding,
	} );

	return (
		<Fragment>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background Color' ),
						},
					] }
				/>
				<PanelBody title={ __( 'Container Padding' ) }>
					<ToggleControl
						label={ isWithPadding ? __( 'Use default padding' ) : __( 'Use no padding' ) }
						onChange={ ( value ) => setAttributes( { isWithPadding: value } ) }
						checked={ isWithPadding }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classes } style={ styles }>
				<InnerBlocks />
			</div>
		</Fragment>
	);
}

export default withColors( 'backgroundColor' )( ContainerEdit );
