/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values, type, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

	return (
		<TagName { ...useBlockWrapperProps.save( { type, reversed, start } ) }>
			<RichText.Content value={ values } multiline="li" />
		</TagName>
	);
}
