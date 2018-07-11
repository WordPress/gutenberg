/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getUnknownTypeHandlerName, rawHandler, serialize, getBlockContent } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

function Converter( { shouldRender, onClick, small, role } ) {
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

const UnknownConverter = compose(
	withSelect( ( select, { uid } ) => {
		const { canUserUseUnfilteredHTML, getBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === getUnknownTypeHandlerName() ),
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
)( Converter );

const HTMLConverter = compose(
	withSelect( ( select, { uid } ) => {
		const { getBlock, canUserUseUnfilteredHTML } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === 'core/html' ),
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
)( Converter );

export { UnknownConverter, HTMLConverter };
