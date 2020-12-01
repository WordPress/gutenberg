/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __experimentalText as Text } from '@wordpress/components';

export default function TemplatePartNamePanel( { postId } ) {
	const [ title ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);
	const [ slug ] = useEntityProp(
		'postType',
		'wp_template_part',
		'slug',
		postId
	);

	return (
		<div className="wp-block-template-part__name-panel">
			<Text variant="label">{ title || slug }</Text>
		</div>
	);
}
