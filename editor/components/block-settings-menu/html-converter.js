/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export function HTMLConverter( { shouldRender, onClick, small, role } ) {
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
		const { getBlock, canUserUseUnfilteredHTML } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name !== 'core/html' ),
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onReplace: () => dispatch( 'core/editor' ).replaceBlocks(
			block.uid,
			rawHandler( {
				HTML: getBlockContent( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} ),
		),
	} ) ),
)( HTMLConverter );
