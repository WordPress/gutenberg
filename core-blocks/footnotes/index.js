/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import FootnotesEdit from './edit.js';
import { orderFootnotes } from './footnotes-utils.js';
import './style.scss';

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

	edit: FootnotesEdit,

	save( { attributes } ) {
		const orderedFootnoteUids = select( 'core/editor' ).getFootnotes();
		const footnotes = orderedFootnoteUids && orderedFootnoteUids.length ?
			orderFootnotes( attributes.footnotes, orderedFootnoteUids ) :
			attributes.footnotes;

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
