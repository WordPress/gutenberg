/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, createBlock, query } from '../../api';
import Editable from '../../editable';

const { children } = query;

registerBlock( 'core/preformatted', {
	title: wp.i18n.__( 'Preformatted' ),

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
