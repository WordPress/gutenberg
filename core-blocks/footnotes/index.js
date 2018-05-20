/**
 * External dependencies
 */
import { get } from 'lodash';

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

export const settings = {
	title: __( 'Footnotes' ),
	description: __( 'List of footnotes from the article' ),
	category: 'common',
	useOnce: true,
	keywords: [ __( 'footnotes' ), __( 'references' ) ],

	attributes: {
		footnotes: {
			type: 'array',
			source: 'query',
			selector: 'li',
			query: {
				id: {
					source: 'attribute',
					attribute: 'id',
				},
				text: {
					source: 'children',
				},
			},
			default: [],
		},
	},

	edit: withSelect( ( select ) => ( {
		footnotesOrder: select( 'core/editor' ).getFootnotes(),
	} ) )( withState( {
		editable: null,
	} )( ( { attributes, editable, footnotesOrder, isSelected, setAttributes, setState } ) => {
		const { footnotes } = attributes;
		const onSetActiveEditable = ( index ) => () => {
			setState( { editable: index } );
		};

		return (
			<ol className="blocks-footnotes__footnotes-list">
				{ footnotesOrder.map( ( footnoteUid, i ) => {
					const filteredFootnotes = footnotes.filter(
						( footnote ) => footnote.id === footnoteUid );
					const value = get( filteredFootnotes, [ 0, 'text' ] );

					return (
						<li key={ footnoteUid }>
							<RichText
								tagName="span"
								value={ value }
								onChange={
									( nextValue ) => {
										const nextFootnotes = footnotes.filter(
											( footnote ) => footnote.id !== footnoteUid );

										nextFootnotes.push( {
											id: footnoteUid,
											text: nextValue,
										} );

										setAttributes( {
											footnotes: nextFootnotes,
										} );
									}
								}
								isSelected={ isSelected && editable === i }
								placeholder={ __( 'Write footnote…' ) }
								onFocus={ onSetActiveEditable( i ) }
							/>
						</li>
					);
				} ) }
			</ol>
		);
	} ) ),

	save( { attributes } ) {
		const { footnotes } = attributes;

		return (
			<div>
				<ol>
					{ footnotes.map( ( footnote ) => (
						<li id={ footnote.id } key={ footnote.id }>
							{ footnote.text }
						</li>
					) ) }
				</ol>
			</div>
		);
	},
};
