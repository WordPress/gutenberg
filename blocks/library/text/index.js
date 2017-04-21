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

	controls: [
		{
			icon: 'editor-alignleft',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => ! align || 'left' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: undefined } );
			}
		},
		{
			icon: 'editor-aligncenter',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'center' } );
			}
		},
		{
			icon: 'editor-alignright',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'right' } );
			}
		}
	],

	edit( { attributes, setAttributes, insertBlockAfter, focus, setFocus } ) {
		const { content = <p />, align } = attributes;

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
				style={ align ? { textAlign: align } : null }
				onSplit={ ( before, after ) => {
					setAttributes( { content: before } );
					insertBlockAfter( wp.blocks.createBlock( 'core/text', {
						content: after
					} ) );
				} }
			/>
		);
	},

	save( { attributes } ) {
		// An empty block will have an undefined content field. Return early
		// as an empty string.
		const { content } = attributes;
		if ( ! content ) {
			return '';
		}

		// We only need to transform content if we need to apply the alignment
		// style. Otherwise we can return unmodified.
		const { align } = attributes;
		if ( ! align ) {
			return content;
		}

		return wp.element.Children.map( content, ( paragraph ) => (
			wp.element.cloneElement( paragraph, {
				style: { textAlign: align }
			} )
		) );
	}
} );
