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
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';

function ContainerEdit( { setBackgroundColor, backgroundColor } ) {
	const className = classnames( backgroundColor.class, {
		'has-background': backgroundColor.color,
	} );

	const styles = {
		backgroundColor: backgroundColor.color,
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
			</InspectorControls>
			<div className={ className } style={ styles }>
				<InnerBlocks />
			</div>
		</Fragment>
	);
}

export default withColors( 'backgroundColor' )( ContainerEdit );
