/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	getColorClassName,
	withColors,
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
} from '@wordpress/editor';

export const name = 'core/section';

export const settings = {
	title: sprintf(
		/* translators: Block title modifier */
		__( '%1$s (%2$s)' ),
		__( 'Section' ),
		__( 'beta' )
	),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M21 4H3L2 5v14l1 1h18l1-1V5l-1-1zM8 18H4V6h4v12zm6 0h-4V6h4v12zm6 0h-4V6h4v12z" /></g></svg>,

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
	},

	description: __( 'Group a selection of blocks into a container.' ),

	supports: {
		align: [ 'wide', 'full' ],
	},

	edit: withColors( 'backgroundColor' )( ( props ) => {
		const {
			backgroundColor,
			className,
			setBackgroundColor,
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
						] }
					/>
				</InspectorControls>
				<div
					className={ classnames( 'wp-block-section', className, {
						'has-background': backgroundColor.color,
						[ backgroundColor.class ]: backgroundColor.class,
					} ) }
					style={ {
						backgroundColor: backgroundColor.color,
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
		} = attributes;

		const backgroundClass = getColorClassName( 'background-color', backgroundColor );

		const className = classnames( {
			'has-background': backgroundColor || customBackgroundColor,
			[ backgroundClass ]: backgroundClass,
		} );

		return (
			<div className={ className }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
