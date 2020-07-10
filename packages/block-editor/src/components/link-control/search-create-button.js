/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';

export const LinkControlSearchCreate = ( {
	searchTerm,
	onClick,
	itemProps,
	isSelected,
} ) => {
	if ( ! searchTerm ) {
		return null;
	}

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
				size={ 18 }
				icon="plus"
			/>

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					<mark>{ searchTerm }</mark>
				</span>
				<span className="block-editor-link-control__search-item-info">
					{ __( 'Create a new page' ) }
				</span>
			</span>
		</Button>
	);
};

export default LinkControlSearchCreate;
