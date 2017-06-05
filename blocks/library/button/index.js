/**
 * WordPress dependencies
 */
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { attr, children } = query;

registerBlockType( 'core/button', {
	title: wp.i18n.__( 'Button' ),

	icon: 'button',

	category: 'layout',

	attributes: {
		url: attr( 'a', 'href' ),
		title: attr( 'a', 'title' ),
		text: children( 'a' ),
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'center' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { text, url, title, align } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar value={ align } onChange={ updateAlignment } />
				</BlockControls>
			),
			<span key="button" className="blocks-button" title={ title }>
				<Editable
					tagName="span"
					placeholder={ wp.i18n.__( 'Write label…' ) }
					value={ text }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					inline
					inlineToolbar
					formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
				/>
				{ focus &&
					<form
						className="editable-format-toolbar__link-modal"
						onSubmit={ ( event ) => event.preventDefault() }>
						<input
							className="editable-format-toolbar__link-input"
							type="url"
							required
							value={ url }
							onChange={ ( event ) => setAttributes( { url: event.target.value } ) }
							placeholder={ wp.i18n.__( 'Paste URL or type' ) }
						/>
						<IconButton icon="editor-break" type="submit" />
					</form>
				}
			</span>,
		];
	},

	save( { attributes } ) {
		const { url, text, title, align = 'none' } = attributes;

		return (
			<div className={ `align${ align }` }>
				<a href={ url } title={ title }>
					{ text }
				</a>
			</div>
		);
	},
} );
