/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlockType, transformComponentToText } from '../../api';
import AttributeInput from 'components/attribute-input';

function template( mode ) {
	return function( { attributes, setAttributes } ) {
		return <span>
			Hi, my name is {
				'edit' === mode ?
					<AttributeInput type="text" placeholder="Peter" value={ attributes.name } attribute="name" setAttributes={ setAttributes } /> :
					attributes.name
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
		to: [ transformComponentToText( template( 'save' ) ) ],
	},

	icon: 'list-view',
	category: 'widgets',

	edit: template( 'edit' ),
	save: template( 'save' ),
} );
