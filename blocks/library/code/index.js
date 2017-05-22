/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from '../../api';

const { prop } = query;

registerBlock( 'core/code', {
	title: wp.i18n.__( 'Code' ),

	icon: 'editor-code',

	category: 'common',

	attributes: {
		content: prop( 'code', 'textContent' ),
	},

	edit( { attributes, setAttributes, setFocus } ) {
		return (
			<TextareaAutosize
				value={ attributes.content }
				onFocus={ setFocus }
				onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
