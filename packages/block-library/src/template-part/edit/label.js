/**
 * External dependencies
 */
import { capitalize } from 'lodash';

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

	const label = capitalize( title || slug );

	return (
		<div className="wp-block-template-part__label-container">
			<div className="wp-block-template-part__label-layout">
				<div className="wp-block-template-part__label-content">
					<Icon icon="block-default" size={ 13 } />
					<span className="wp-block-template-part__label-text">
						{ label }
					</span>
				</div>
			</div>
		</div>
	);
}
