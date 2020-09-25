/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { align, content, level } = attributes;
	const TagName = 'h' + level;

	const className = classnames( {
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<TagName { ...getBlockProps( { className } ) }>
			<RichText.Content value={ content } />
		</TagName>
	);
}
