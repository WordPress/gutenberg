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

		return (
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
				isSelected={ isSelected }
			/>
		);
	},

	save( { attributes, className } ) {
		const { content } = attributes;

		return <p className={ className }>{ content }</p>;
	},
};
