/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query, setUnknownTypeHandler } from '../../api';
import FreeformBlock from './freeform-block';

const { children } = query;

registerBlockType( 'core/freeform', {
	title: __( 'Classic Text' ),

	icon: 'editor-kitchensink',

	category: 'formatting',

	attributes: {
		content: children(),
	},

	defaultAttributes: {
		content: <p />,
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { content } = attributes;

		return (
			<FreeformBlock
				className={ className }
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
