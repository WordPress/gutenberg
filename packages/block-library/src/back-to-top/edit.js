/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function BackToTopEdit( { attributes, setAttributes } ) {
	const { text } = attributes;
	return (
		<p { ...useBlockProps() }>
			<RichText
				tagName="a"
				href="#top"
				value={ text ? text : __( 'Back to Top' ) }
				withoutInteractiveFormatting={ true }
				onChange={ ( newLinkText ) =>
					setAttributes( { text: newLinkText } )
				}
			/>
		</p>
	);
}
