/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { source } from '@wordpress/block-api';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';

const { children } = source;
const createTransformationBlock = ( name, attributes ) => ( { name, attributes } );

registerBlockType( 'core/preformatted', {
	title: __( 'Preformatted' ),

	icon: 'text',

	category: 'formatting',

	attributes: {
		content: {
			type: 'array',
			source: children( 'pre' ),
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createTransformationBlock( 'core/preformatted', attributes ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createTransformationBlock( 'core/paragraph', attributes ),
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { content } = attributes;

		return (
			<Editable
				tagName="pre"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				placeholder={ __( 'Write preformatted text…' ) }
				className={ className }
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;

		return <pre>{ content }</pre>;
	},
} );
