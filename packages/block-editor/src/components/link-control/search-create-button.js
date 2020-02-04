/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';

export const LinkControlSearchCreate = ( {
	searchTerm = '',
	onClick,
	itemProps,
	isSelected,
} ) => {
	return (
		<Button
			{ ...itemProps }
			className={ classnames(
				'block-editor-link-control__search-create block-editor-link-control__search-item',
				{
					'is-selected': isSelected,
				}
			) }
			onClick={ onClick }
		>
			<Icon
				className="block-editor-link-control__search-item-icon"
				icon="insert"
			/>

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					{ sprintf( __( 'Create new Page: %s' ), searchTerm ) }
				</span>
			</span>
		</Button>
	);
};

export default LinkControlSearchCreate;
