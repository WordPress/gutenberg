/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from '../../api';
import Editable from '../../editable';

const { children } = query;

registerBlock( 'core/code', {
	title: wp.i18n.__( 'Code' ),

	icon: 'editor-code',

	category: 'common',

	attributes: {
		content: children( 'code' ),
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		return (
			<Editable
				tagName="pre"
				value={ attributes.content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				focus={ focus }
				onFocus={ setFocus }
				formattingControls={ [] }
			/>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
