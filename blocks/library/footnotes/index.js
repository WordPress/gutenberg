import { mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { registerBlockType } from '../../api';

registerBlockType( 'core/footnotes', {
	title: __( 'Footnotes' ),

	icon: 'button',

	category: 'layout',

	attributes: {
		footnotes: {
			type: 'object',
		},
	},

	save( { attributes } ) {
		const { footnotes = {} } = attributes;

		const footnoteElements = Object.keys( footnotes ).map( footnoteId => <p key={ footnoteId } id={ `footnote-${ footnoteId }` }>{footnotes[ footnoteId ]}</p> );

		return (
			<div>
				<h2>{ __( 'Footnotes' ) }</h2>
				{ footnoteElements }
			</div>
		);
	},
} );
