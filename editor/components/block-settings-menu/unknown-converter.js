/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getUnknownTypeHandlerName, rawHandler, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlock } from '../../state/selectors';
import { replaceBlocks } from '../../state/actions';

export function UnknownConverter( { block, convertToBlocks, small } ) {
	if ( ! block || getUnknownTypeHandlerName() !== block.name ) {
		return null;
	}

	const label = __( 'Convert to blocks' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ () => convertToBlocks( block ) }
			icon="screenoptions"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state, { uid } ) => ( {
		block: getBlock( state, uid ),
	} ),
	( dispatch, { uid } ) => ( {
		convertToBlocks( block ) {
			dispatch( replaceBlocks( uid, rawHandler( {
				HTML: serialize( block ),
				mode: 'BLOCKS',
			} ) ) );
		},
	} )
)( UnknownConverter );
