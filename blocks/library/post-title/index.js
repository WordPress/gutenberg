/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType, source } from '../../api';
import PostTitleEdit from './post-title-edit';

registerBlockType( 'core/post-title', {
	title: __( 'Post Title' ),

	keywords: [ __( 'title' ) ],

	className: false,

	category: 'common',

	attributes: {
		content: {
			type: 'string',
			source: source.text(),
		},
	},

	isFixed: true,

	edit( { attributes, setAttributes, focus, setFocus } ) {
		return <PostTitleEdit
			title={ attributes.content }
			focus={ focus }
			setFocus={ setFocus }
			onChange={ value => setAttributes( { content: value } ) }
			/>;
	},

	save( { attributes } ) {
		return <h1> { attributes.content } </h1>;
	},
} );
