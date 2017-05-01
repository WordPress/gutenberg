/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { children } = query;

registerBlock( 'core/text', {
	title: wp.i18n.__( 'Text' ),

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
			content: wp.element.concatChildren( attributes.content, attributesToMerge.content )
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
					insertBlockAfter( wp.blocks.createBlock( 'core/text', {
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
