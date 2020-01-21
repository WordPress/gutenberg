/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURI } from '@wordpress/url';
import {
	Button,
	Icon,
} from '@wordpress/components';

export const LinkControlSearchCreate = ( { searchTerm = '', onClick, itemProps } ) => {
	if ( ! searchTerm.trim() ) {
		return null;
	}

	return (
		<Button
			{ ...itemProps }
			onClick={ onClick }
			className={ classnames( 'block-editor-link-control__search-create block-editor-link-control__search-item', {
			} ) }
		>

			<Icon className="block-editor-link-control__search-item-icon" icon="insert" />

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					{ sprintf( __( 'Create new Page: %s' ), searchTerm ) }
				</span>
				<span className="block-editor-link-control__search-item-info">
					{ safeDecodeURI( '/some-url/' ) }
				</span>
			</span>

			<span className="block-editor-link-control__search-item-type">Page</span>

		</Button>
	);
};

export default LinkControlSearchCreate;

