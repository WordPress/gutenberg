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
	SelectControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';

function ContainerEdit( { className, setBackgroundColor, backgroundColor, setAttributes, attributes } ) {
	const { paddingClassName } = attributes;

	const styles = {
		backgroundColor: backgroundColor.color,
	};

	const classes = classnames( className, paddingClassName );

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
					<SelectControl
						label={ __( 'Padding' ) }
						value={ paddingClassName }
						options={ [
							{ value: '', label: __( 'None' ) },
							{ value: 'is-narrow-padding', label: __( 'Narrow' ) },
							{ value: 'is-wide-padding', label: __( 'Wide' ) },
						] }
						onChange={ ( newClassName ) => setAttributes( { paddingClassName: newClassName } ) }
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
