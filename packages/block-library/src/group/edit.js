/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	withColors,
	ResponsiveBlockControl,
} from '@wordpress/block-editor';

import {
	PanelBody,
	SelectControl,
} from '@wordpress/components';

function GroupEdit( {
	className,
	setBackgroundColor,
	backgroundColor,
	hasInnerBlocks,
} ) {
	const styles = {
		backgroundColor: backgroundColor.color,
	};

	const classes = classnames( className, backgroundColor.class, {
		'has-background': !! backgroundColor.color,
	} );

	const sizeOptions = [
		{
			label: __( 'Please select…' ),
			value: '',
		},
		{
			label: __( 'Small' ),
			value: 'small',
		},
		{
			label: __( 'Medium' ),
			value: 'medium',
		},

	];

	return (
		<>
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

				<PanelBody title={ __( 'Spacing' ) }>
					<ResponsiveBlockControl
						legend="Padding"
						property="padding"
						renderDefaultControl={ ( labelComponent ) => (
							<SelectControl
								label={ labelComponent }
								options={ sizeOptions }
							/>
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classes } style={ styles }>
				<div className="wp-block-group__inner-container">
					<InnerBlocks
						renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
					/>
				</div>
			</div>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
] )( GroupEdit );
