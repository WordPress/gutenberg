/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

export default function TokenEdit( {
	attributes,
	className,
	isSelected,
	setAttributes,
} ) {
	const { content, tagName: Tag } = attributes;

	if ( isSelected ) {
		return (
			<RichText
				identifier="content"
				className={ className }
				tagName={ Tag }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
			/>
		);
	}

	return (
		<Tag className={ className }>
			<ServerSideRender block="core/token" attributes={ attributes } />
		</Tag>
	);
}
