/**
 * External dependencies
 */
import { castArray, flow, noop, some, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

export function BlockRemoveButton( { onRemove, onClick = noop, isLocked, role, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const label = __( 'Remove Block' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onRemove, onClick ) }
			icon="trash"
			label={ label }
			role={ role }
			{ ...omit( props, 'clientIds' ) }
		>
			{ label }
		</IconButton>
	);
}

export default compose(
	withDispatch( ( dispatch, { clientIds } ) => ( {
		onRemove() {
			dispatch( 'core/editor' ).removeBlocks( clientIds );
		},
	} ) ),
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/editor' );

		return {
			isLocked: some( castArray( clientIds ), ( clientId ) => {
				const rootClientId = getBlockRootClientId( clientId );
				const templateLock = getTemplateLock( rootClientId );
				return templateLock === 'all';
			} ),
		};
	} ),
)( BlockRemoveButton );
