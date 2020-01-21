/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { safeDecodeURI } from '@wordpress/url';
import {
	Button,
	Icon,
} from '@wordpress/components';

export const LinkControlSearchCreate = ( { searchTerm = '', onClick, itemProps } ) => {
	return (
		<Button
			{ ...itemProps }
			onClick={ onClick }
			className={ classnames( 'block-editor-link-control__search-item', {
			} ) }
		>

			<Icon className="block-editor-link-control__search-item-icon" icon="admin-page" />

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					{ searchTerm }
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

