/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/editor';
import { BaseControl, PanelBody, ResizableBox, G, SVG, Path } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';

export const name = 'core/spacer';

export const settings = {
	title: __( 'Spacer' ),

	description: __( 'Add white space between blocks and customize its height.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><G><Path d="M13 4v2h3.59L6 16.59V13H4v7h7v-2H7.41L18 7.41V11h2V4h-7" /></G></SVG>,

	category: 'layout',

	attributes: {
		height: {
			type: 'number',
			default: 100,
		},
	},

	edit: withInstanceId(
		( { attributes, isSelected, setAttributes, toggleSelection, instanceId } ) => {
			const { height } = attributes;
			const id = `block-spacer-height-input-${ instanceId }`;

			return (
				<Fragment>
					<ResizableBox
						className={ classnames(
							'block-library-spacer__resize-container',
							{ 'is-selected': isSelected }
						) }
						size={ {
							height,
						} }
						minHeight="20"
						enable={ {
							top: false,
							right: false,
							bottom: true,
							left: false,
							topRight: false,
							bottomRight: false,
							bottomLeft: false,
							topLeft: false,
						} }
						onResizeStop={ ( event, direction, elt, delta ) => {
							setAttributes( {
								height: parseInt( height + delta.height, 10 ),
							} );
							toggleSelection( true );
						} }
						onResizeStart={ () => {
							toggleSelection( false );
						} }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Spacer Settings' ) }>
							<BaseControl label={ __( 'Height in pixels' ) } id={ id }>
								<input
									type="number"
									id={ id }
									onChange={ ( event ) => {
										setAttributes( {
											height: parseInt( event.target.value, 10 ),
										} );
									} }
									value={ height }
									min="20"
									step="10"
								/>
							</BaseControl>
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);
		}
	),

	save( { attributes } ) {
		return <div style={ { height: attributes.height } } aria-hidden />;
	},
};
