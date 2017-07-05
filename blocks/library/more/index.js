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
import BlockDescription from '../../block-description';

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
						<BlockDescription>
							<p>{ __( '"More" allows you to break your post into a part shown on index pages, and the subsequent after clicking a "Read More" link.</p><p className="editor-block-inspector__description">"More" allows you to break your post into a part shown on index pages, and the subsequent after clicking a "Read More" link.' ) }</p>
						</BlockDescription>
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
