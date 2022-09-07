/**
 * WordPress dependencies
 */
import { list as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecatedVersions from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

function computeDeprecatedNestedListValues( block ) {
	if ( ! block ) return '';
	const tagName = block.attributes.ordered ? 'ol' : 'ul';
	return `<${ tagName }>${ computeDeprecatedValues( block ) }</${ tagName }>`;
}

function computeDeprecatedValues( block ) {
	deprecated( 'Values attribute on the list block', {
		since: '6.0',
		version: '6.5',
		alternative: 'inner blocks',
	} );

	return block.innerBlocks
		.map( ( innerBlock ) => {
			return (
				'<li>' +
				innerBlock.attributes.content +
				computeDeprecatedNestedListValues(
					innerBlock.innerBlocks?.[ 0 ]
				) +
				'</li>'
			);
		} )
		.join( '' );
}

const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/list-item',
				attributes: { content: __( 'Alice.' ) },
			},
			{
				name: 'core/list-item',
				attributes: { content: __( 'The White Rabbit.' ) },
			},
			{
				name: 'core/list-item',
				attributes: { content: __( 'The Cheshire Cat.' ) },
			},
			{
				name: 'core/list-item',
				attributes: { content: __( 'The Mad Hatter.' ) },
			},
			{
				name: 'core/list-item',
				attributes: { content: __( 'The Queen of Hearts.' ) },
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated: deprecatedVersions,
	deprecatedAttributes: {
		values: computeDeprecatedValues,
	},
};

export { settings };

export const init = () => initBlock( { name, metadata, settings } );
