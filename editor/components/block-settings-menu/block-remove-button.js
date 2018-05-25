/**
 * External dependencies
 */
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';

export function BlockRemoveButton( { onRemove, onClick = noop, isLocked, role, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const label = __( 'Remove' );

	return (
		<IconButton
			className="editor-block-settings-remove"
			onClick={ flow( onRemove, onClick ) }
			icon="trash"
			label={ label }
			role={ role }
			{ ...props }
		/>
	);
}

export default compose(
	withDispatch( ( dispatch, { uids } ) => ( {
		onRemove() {
			dispatch( 'core/editor' ).removeBlocks( uids );
		},
	} ) ),
	withSelect( ( select ) => {
		const { templateLock } = select( 'core/editor' ).getEditorSettings();

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockRemoveButton );
