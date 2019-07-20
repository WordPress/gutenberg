/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	InspectorControls,
	withColors,
	PanelColorSettings,
	RichText,
} from '@wordpress/block-editor';
import { memo } from '@wordpress/element';

const SiteTitleColorUI = memo(
	function( {
		textColorValue,
		setTextColor,
	} ) {
		return (
			<PanelColorSettings
				title={ __( 'Color Settings' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: textColorValue,
						onChange: setTextColor,
						label: __( 'Text Color' ),
					},
				] }
			/>
		);
	}
);

function SiteTitleEdit( {
	attributes,
	setAttributes,
	textColor,
	setTextColor,
} ) {
	const { title } = attributes;

	return (
		<>
			<InspectorControls>
				<SiteTitleColorUI
					setTextColor={ setTextColor }
					textColorValue={ textColor.color }
				/>
			</InspectorControls>
			<RichText
				tagName="h1"
				value={ title }
				onChange={ ( newTitle ) => setAttributes( { title: newTitle } ) }
				placeholder={ __( 'Site Title' ) }
				aria-label={ __( 'Site Title' ) }
				wrapperClassName={ classnames( 'wp-block-site-title', {
					'has-text-color': textColor.color,
					[ textColor.class ]: textColor.class,
				} ) }
				style={ {
					color: textColor.color,
					fontSize: '28px',
				} }
			/>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( SiteTitleEdit );
