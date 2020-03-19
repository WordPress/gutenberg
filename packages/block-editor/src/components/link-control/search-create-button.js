/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';

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
				icon="insert"
			/>

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: search term. */
							__( 'New page: <mark>%s</mark>' ),
							searchTerm
						),
						{ mark: <mark /> }
					) }
				</span>
			</span>
		</Button>
	);
};

export default LinkControlSearchCreate;
