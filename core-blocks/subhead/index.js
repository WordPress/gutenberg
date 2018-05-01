/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import {
	createBlock,
	RichText,
	InspectorControls,
	AlignmentToolbar,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';

export const name = 'core/subhead';

export const settings = {
	title: __( 'Subhead' ),

	description: __( 'Explanatory text under the main heading of an article.' ),

	icon: 'text',

	category: 'common',

	useOnce: true,

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
		align: {
			type: 'string',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/subhead', {
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, className } ) {
		const { align, content, placeholder } = attributes;

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Subhead Settings' ) }>
						<p>{ __( 'Text Alignment' ) }</p>
						<AlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
						/>
					</PanelBody>
				</InspectorControls>
				<RichText
					tagName="p"
					value={ content }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					style={ { textAlign: align } }
					className={ className }
					placeholder={ placeholder || __( 'Write subhead…' ) }
				/>
			</Fragment>
		);
	},

	save( { attributes, className } ) {
		const { align, content } = attributes;

		return (
			<RichText.Content
				tagName="p"
				className={ className }
				style={ { textAlign: align } }
				value={ content }
			/>
		);
	},
};
