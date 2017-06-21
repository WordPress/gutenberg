/**
 * WordPress
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, query } from '../../api';
import Editable from '../../editable';

const { children } = query;

registerBlockType( 'core/preformatted', {
	title: __( 'Preformatted' ),

	icon: 'text',

	category: 'formatting',

	attributes: {
		content: children( 'pre' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( attributes ) =>
					createBlock( 'core/preformatted', attributes ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( attributes ) =>
					createBlock( 'core/text', attributes ),
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
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
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;

		return <pre>{ content }</pre>;
	},
} );
