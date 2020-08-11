/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

export default function TemplatePartNotice( { postId, slug } ) {
	const [ title ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);

	return (
		<div className="wp-block-template-part__notice-container">
			<div className="wp-block-template-part__notice-layout">
				<div className="wp-block-template-part__notice-text">
					{ title || slug }
				</div>
			</div>
		</div>
	);
}
