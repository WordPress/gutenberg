/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FootnotesEditor from './editor.js';
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

	edit: FootnotesEditor,

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
