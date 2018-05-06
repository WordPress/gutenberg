/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withState } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { RichText } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';

export const name = 'core/footnotes';

/**
 * Returns the text to be used for the footnotes.
 *
 * @param {?Array|string} text Text which might be a string or an array of
 * strings and nodes.
 *
 * @return {Array} Same text formatted as an array.
 */
const getFootnotesText = ( text ) => {
	if ( ! text ) {
		return [];
	}

	if ( ! Array.isArray( text ) ) {
		return [ text ];
	}

	return text;
};

/**
 * Returns the footnotes contained in the blocks.
 *
 * @param {Object} blocksByUid Object containing the blocks where to extract
 * the footnotes from.
 *
 * @return {Array} Footnote ids contained in the blocks.
 */
const getFootnotesFromBlocks = ( blocksByUid ) => {
	return Object.keys( blocksByUid ).reduce(
		( footnotes, blockUid ) => {
			const block = blocksByUid[ blockUid ];

			if ( ! block.attributes ||
					! block.attributes.blockFootnotes ) {
				return footnotes;
			}

			return footnotes.concat( block.attributes.blockFootnotes );
		},
		[]
	);
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

	edit: withSelect( ( select ) => ( {
		blocks: select( 'core/editor' ) ? select( 'core/editor' ).getBlocks() : [],
	} ) )( withState( {
		editable: null,
	} )( ( { attributes, blocks, editable, isSelected, setAttributes, setState } ) => {
		const footnotes = getFootnotesFromBlocks( blocks );

		if ( ! footnotes.length ) {
			return null;
		}

		const { texts } = attributes;
		const onSetActiveEditable = ( index ) => () => {
			setState( { editable: index } );
		};

		return (
			<ol className="blocks-footnotes__footnotes-list">
				{ footnotes.map( ( footnote, i ) => (
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
				) ) }
			</ol>
		);
	} ) ),

	save( { attributes } ) {
		const { texts } = attributes;
		const footnoteIds = Object.keys( texts );

		if ( ! footnoteIds.length ) {
			return null;
		}

		const footnotes = footnoteIds.map( ( footnoteId ) => {
			return {
				id: footnoteId,
				text: texts[ footnoteId ],
			};
		} );

		return (
			<div>
				<ol>
					{ footnotes.map( ( footnote ) => (
						<li id={ footnote.id } key={ footnote.id }>
							{ getFootnotesText( footnote.text ) }
						</li>
					) ) }
				</ol>
			</div>
		);
	},
};
