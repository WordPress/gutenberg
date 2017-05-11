/**
 * WordPress dependencies
 */
import { concatChildren } from 'element';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlock, createBlock, query } from '../../api';
import Editable from '../../editable';

const { children } = query;

registerBlock( 'core/text', {
	title: __( 'Text' ),

	icon: 'text',

	category: 'common',

	attributes: {
		content: children(),
	},

	defaultAttributes: {
		content: <p />
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content )
		};
	},

	edit( { attributes, setAttributes, insertBlockAfter, focus, setFocus, mergeWithPrevious } ) {
		const { content } = attributes;

		return (
			<Editable
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				onSplit={ ( before, after ) => {
					setAttributes( { content: before } );
					insertBlockAfter( createBlock( 'core/text', {
						content: after
					} ) );
				} }
				onMerge={ mergeWithPrevious }
				showAlignments
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;
		return content;
	}
} );
