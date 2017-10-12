/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, source } from '../../api';
import Editable from '../../editable';
import UrlInput from '../../url-input';
import BlockControls from '../../block-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import ColorPalette from '../../color-palette';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { attr, children } = source;

registerBlockType( 'core/button', {
	title: __( 'Button' ),

	icon: 'button',

	category: 'layout',

	attributes: {
		url: {
			type: 'string',
			source: attr( 'a', 'href' ),
		},
		title: {
			type: 'string',
			source: attr( 'a', 'title' ),
		},
		text: {
			type: 'array',
			source: children( 'a' ),
		},
		align: {
			type: 'string',
			default: 'none',
		},
		color: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align, clear } = attributes;
		const props = {};

		if ( 'left' === align || 'right' === align || 'center' === align ) {
			props[ 'data-align' ] = align;
		}

		if ( clear ) {
			props[ 'data-clear' ] = 'true';
		}

		return props;
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { text, url, title, align, color, clear } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const toggleClear = () => setAttributes( { clear: ! clear } );

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar value={ align } onChange={ updateAlignment } />
				</BlockControls>
			),
			<span key="button" className={ className } title={ title } style={ { backgroundColor: color } } >
				<Editable
					tagName="span"
					placeholder={ __( 'Add text…' ) }
					value={ text }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
					keepPlaceholderOnFocus
				/>
				{ focus &&
					<form
						className="blocks-format-toolbar__link-modal"
						onSubmit={ ( event ) => event.preventDefault() }>
						<UrlInput
							value={ url }
							onChange={ ( value ) => setAttributes( { url: value } ) }
						/>
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				}
				{ focus &&
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'A nice little button. Call something out with it.' ) }</p>
						</BlockDescription>

						<ToggleControl
							label={ __( 'Stand on a line' ) }
							checked={ !! clear }
							onChange={ toggleClear }
						/>

						<ColorPalette
							value={ color }
							onChange={ ( colorValue ) => setAttributes( { color: colorValue } ) }
						/>
						<InspectorControls.TextControl
							label={ __( 'Hex Color' ) }
							value={ color || '' }
							onChange={ ( value ) => setAttributes( { color: value } ) }
						/>
					</InspectorControls>
				}
			</span>,
		];
	},

	save( { attributes } ) {
		const { url, text, title, align, color } = attributes;

		return (
			<div className={ `align${ align }` } style={ { backgroundColor: color } }>
				<a href={ url } title={ title }>
					{ text }
				</a>
			</div>
		);
	},
} );
