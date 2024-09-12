/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls } from '../components';
import { unlock } from '../lock-unlock';

// The implementation of content locking is mainly in this file, although the mechanism
// to stop temporarily editing as blocks when an outside block is selected is on component StopEditingAsBlocksOnOutsideSelect
// at block-editor/src/components/block-list/index.js.
// Besides the components on this file and the file referenced above the implementation
// also includes artifacts on the store (actions, reducers, and selector).

function ContentLockControlsPure( { clientId } ) {
	const { templateLock, isLockedByParent, isEditingAsBlocks } = useSelect(
		( select ) => {
			const {
				getContentLockingParent,
				getTemplateLock,
				getTemporarilyEditingAsBlocks,
			} = unlock( select( blockEditorStore ) );
			return {
				templateLock: getTemplateLock( clientId ),
				isLockedByParent: !! getContentLockingParent( clientId ),
				isEditingAsBlocks: getTemporarilyEditingAsBlocks() === clientId,
			};
		},
		[ clientId ]
	);

	const { stopEditingAsBlocks } = unlock( useDispatch( blockEditorStore ) );
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';

	const stopEditingAsBlockCallback = useCallback( () => {
		stopEditingAsBlocks( clientId );
	}, [ clientId, stopEditingAsBlocks ] );

	if ( ! isContentLocked && ! isEditingAsBlocks ) {
		return null;
	}

	const showStopEditingAsBlocks = isEditingAsBlocks && ! isContentLocked;

	return (
		showStopEditingAsBlocks && (
			<BlockControls group="other">
				<ToolbarButton onClick={ stopEditingAsBlockCallback }>
					{ __( 'Done' ) }
				</ToolbarButton>
			</BlockControls>
		)
	);
}

export default {
	edit: ContentLockControlsPure,
	hasSupport() {
		return true;
	},
};
