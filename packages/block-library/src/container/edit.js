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
	const { hasPadding } = attributes;

	const styles = {
		backgroundColor: backgroundColor.color,
	};

	const classes = classnames( className, backgroundColor.class, {
		'has-padding': hasPadding,
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
						label={ hasPadding ? __( 'Padding Applied' ) : __( 'No Padding' ) }
						onChange={ ( value ) => setAttributes( { hasPadding: value } ) }
						checked={ hasPadding }
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
