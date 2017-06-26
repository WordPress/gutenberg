/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';

registerBlockType( 'core/more', {
	title: __( 'More' ),

	icon: 'editor-insertmore',

	category: 'layout',

	attributes: {
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { text } = attributes;

		return (
			<div className="blocks-more">
				<Editable
					tagName="span"
					value={ text || __( 'Read more' ) }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					inline
					formattingControls={ [] }
				/>
				{ focus &&
					<InspectorControls key="inspector">
						<p>The "more" block allows you to set a content break point on your post. Visitors of your blog are then presented with just the initial content and a link to read more.</p>
					</InspectorControls>
				}
			</div>
		);
	},

	save( { attributes } ) {
		const { text } = attributes;

		return text;
	},
} );
