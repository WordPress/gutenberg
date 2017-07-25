/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlockType, createBlock } from '../../api';

function template( mode ) {
	return function( { attributes, setAttributes } ) {
		return <span>
			Hi, my name is {
				'edit' === mode ?
					<input type="text" placeholder="Peter" value={ attributes.name } onChange={ ( e ) => setAttributes( { name: e.target.value } ) } />
					: <span>{ attributes.name }</span>
			}! <br />
			#intro { tagify( attributes.name ) }
		</span>;
	};
}

function tagify( name ) {
	return name ? '#' + name.toLowerCase().replace( /\s+/g, '-' ) : '';
}

registerBlockType( 'core/template', {
	title: __( 'Template for Templates' ),
	defaultAttributes: {
		name: '',
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( attributes ) => createBlock( 'core/text', { content: template( 'save' )( { attributes } ) } ),
			},
		],
	},

	icon: 'list-view',

	category: 'widgets',

	edit: template( 'edit' ),
	save: template( 'save' ),
} );
