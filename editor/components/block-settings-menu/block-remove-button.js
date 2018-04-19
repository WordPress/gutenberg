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
import { withDispatch } from '@wordpress/data';
import { withEditorSettings } from '@wordpress/blocks';

export function BlockRemoveButton( { onRemove, onClick = noop, onFocus, onBlur, isLocked, role } ) {
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
			onFocus={ onFocus }
			onBlur={ onBlur }
		/>
	);
}

export default compose(
	withDispatch( ( dispatch, { uids } ) => ( {
		onRemove() {
			dispatch( 'core/editor' ).removeBlocks( uids );
		},
	} ) ),
	withEditorSettings( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockRemoveButton );
