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

export const name = 'core/container';

export const settings = {
	title: sprintf(
		/* translators: Block title modifier */
		__( '%1$s (%2$s)' ),
		__( 'Container' ),
		__( 'beta' )
	),

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
	},

	description: __( 'Group blocks into a container.' ),

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
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
					className={ classnames( className, {
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
