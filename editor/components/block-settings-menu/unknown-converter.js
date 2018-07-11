/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getUnknownTypeHandlerName, rawHandler, serialize } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export function UnknownConverter( { shouldRender, onClick, small, role } ) {
	if ( ! shouldRender ) {
		return null;
	}

	const label = __( 'Convert to Blocks' );
	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ onClick }
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
		const { canUserUseUnfilteredHTML, getBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === getUnknownTypeHandlerName() )
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onClick: () => dispatch( 'core/editor' ).replaceBlocks(
			block.uid,
			rawHandler( {
				HTML: serialize( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} )
		),
	} ) ),
)( UnknownConverter );
