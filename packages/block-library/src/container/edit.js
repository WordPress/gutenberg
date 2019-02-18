/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';

const MIN_PADDING = 0;
const MAX_PADDING = 50;

function ContainerEdit( { className, setBackgroundColor, backgroundColor, setAttributes, attributes } ) {
	const { padding } = attributes;

	const styles = {
		backgroundColor: backgroundColor.color,
		padding: padding ? `${ padding }%` : undefined,
	};

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
				<PanelBody title={ __( 'Container padding' ) }>
					<RangeControl
						label={ __( 'Padding' ) }
						value={ padding }
						onChange={ ( newPadding ) => {
							setAttributes( {
								padding: newPadding,
							} );
						} }
						min={ MIN_PADDING }
						max={ MAX_PADDING }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ className } style={ styles }>
				<InnerBlocks />
			</div>
		</Fragment>
	);
}

export default withColors( 'backgroundColor' )( ContainerEdit );
