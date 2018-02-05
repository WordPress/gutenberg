/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { createBlock } from '../../api';
import RichText from '../../rich-text';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

export const name = 'core/subhead';

export const settings = {
	title: __( 'Subhead' ),

	icon: 'text',

	category: 'common',

	useOnce: true,

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
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

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { content, placeholder } = attributes;

		return [
			isSelected && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Explanatory text under the main heading of an article.' ) }</p>
					</BlockDescription>
				</InspectorControls>
			),
			<RichText
				tagName="p"
				key="editable"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				className={ className }
				placeholder={ placeholder || __( 'Write subhead…' ) }
			/>,
		];
	},

	save( { attributes, className } ) {
		const { content } = attributes;

		return <p className={ className }>{ content }</p>;
	},
};
