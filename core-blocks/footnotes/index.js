/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withState } from '@wordpress/components';
import { RichText } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

export const name = 'core/footnotes';

const getFootnotesText = ( text ) => {
	if ( ! text ) {
		return [];
	}
	if ( ! Array.isArray( text ) ) {
		return [ text ];
	}
	return text;
};

export const settings = {
	title: __( 'Footnotes' ),
	description: __( 'List of footnotes from the article' ),
	category: 'common',
	keywords: [ __( 'footnotes' ), __( 'references' ) ],

	attributes: {
		footnotes: {
			type: 'array',
			default: [],
		},
		texts: {
			type: 'object',
			default: [],
		},
	},

	edit: withState( {
		editable: null,
	} )( ( { attributes, editable, isSelected, setAttributes, setState } ) => {
		const { footnotes, texts } = attributes;
		const onSetActiveEditable = ( index ) => () => {
			setState( { editable: index } );
		};
		const footnotesBlock = footnotes.map( ( footnote, i ) => (
			<li key={ footnote }>
				<RichText
					tagName="span"
					value={ getFootnotesText( texts[ footnote ] ) }
					onChange={
						( nextValue ) => {
							setAttributes( {
								texts: {
									...texts,
									[ footnote ]: nextValue,
								},
							} );
						}
					}
					isSelected={ isSelected && editable === i }
					placeholder={ __( 'Write footnote…' ) }
					onFocus={ onSetActiveEditable( i ) }
				/>
			</li>
		) );

		return (
			<ol className="blocks-footnotes__footnotes-list">
				{ footnotesBlock }
			</ol>
		);
	} ),

	save( { attributes } ) {
		const { footnotes, texts } = attributes;
		const footnotesBlock = footnotes.map( ( footnote ) => (
			<li id={ footnote } key={ footnote }>
				{ getFootnotesText( texts[ footnote ] ) }
			</li>
		) );

		return (
			<div>
				<ol>
					{ footnotesBlock }
				</ol>
			</div>
		);
	},
};
