/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withAPIData } from '@wordpress/components';
import { getUnknownTypeHandlerName, rawHandler, serialize } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getBlock, getCurrentPostType } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

export function UnknownConverter( { block, onReplace, small, user } ) {
	if ( ! block || getUnknownTypeHandlerName() !== block.name ) {
		return null;
	}

	const label = __( 'Convert to blocks' );

	const convertToBlocks = () => {
		onReplace( block.uid, rawHandler( {
			HTML: serialize( block ),
			mode: 'BLOCKS',
			allowIframes: get( user, [ 'data', 'capabilities', 'unfiltered_html' ], false ),
		} ) );
	};

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ convertToBlocks }
			icon="screenoptions"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	connect(
		( state, { uid } ) => ( {
			block: getBlock( state, uid ),
			postType: getCurrentPostType( state ),
		} ),
		{
			onReplace: replaceBlocks,
		}
	),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
)( UnknownConverter );
