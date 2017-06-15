
/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query, setUnknownTypeHandler } from '../../api';
import FreeformBlock from './freeform-block';

const { children } = query;

registerBlockType( 'core/freeform', {
	title: wp.i18n.__( 'Freeform' ),

	icon: 'text',

	category: 'common',

	attributes: {
		content: children(),
	},

	defaultAttributes: {
		content: <p />,
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { content } = attributes;

		return (
			<FreeformBlock
				content={ content }
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
		return content;
	},
} );

setUnknownTypeHandler( 'core/freeform' );
