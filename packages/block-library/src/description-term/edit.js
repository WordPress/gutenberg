/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<RichText
			tagName={ Block.dt }
			value={ attributes.content }
			onChange={ ( content ) => setAttributes( { content } ) }
		/>
	);
}
