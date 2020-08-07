/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { Icon } from '@wordpress/components';

export default function TemplatePartLabel( { postId, slug } ) {
	const [ title ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);

	return (
		<div className="wp-block-template-part__label-container">
			<div className="wp-block-template-part__label-layout">
				<div className="wp-block-template-part__label-content">
					<Icon icon="controls-repeat" size={ 12 } />
					<span className="wp-block-template-part__label-text">
						{ title || slug }
					</span>
				</div>
			</div>
		</div>
	);
}
