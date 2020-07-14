/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default ( { attributes, setAttributes } ) => {
	return (
		<>
			<RichText
				tagName="div"
				value={ attributes.content }
				onChange={ ( content ) => {
					setAttributes( { content } );
				} }
				placeholder={ __( 'Visible Content' ) }
			/>
			<hr />
			<InnerBlocks />
		</>
	);
};
