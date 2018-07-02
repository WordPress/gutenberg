/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withAPIData } from '@wordpress/components';
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export function HTMLConverter( { block, onReplace, small, user, role } ) {
	if ( ! block || block.name !== 'core/html' ) {
		return null;
	}

	const label = __( 'Convert to blocks' );

	const convertToBlocks = () => {
		onReplace( block.uid, rawHandler( {
			HTML: getBlockContent( block ),
			mode: 'BLOCKS',
			canUserUseUnfilteredHTML: get( user, [ 'data', 'capabilities', 'unfiltered_html' ], false ),
		} ) );
	};

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ convertToBlocks }
			icon="screenoptions"
			label={ small ? label : undefined }
			role={ role }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	withSelect( ( select, { uid } ) => {
		const { getBlock, getCurrentPostType } = select( 'core/editor' );
		return {
			block: getBlock( uid ),
			postType: getCurrentPostType(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onReplace: dispatch( 'core/editor' ).replaceBlocks,
	} ) ),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
)( HTMLConverter );
