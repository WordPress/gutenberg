/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityToolbar( { clientId } ) {
	const { canToggleBlockVisibility, isBlockHidden } = useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			const { isBlockHidden: _isBlockHidden } = unlock(
				select( blockEditorStore )
			);
			return {
				canToggleBlockVisibility: hasBlockSupport(
					getBlockName( clientId ),
					'blockVisibility',
					true
				),
				isBlockHidden: _isBlockHidden( clientId ),
			};
		},
		[ clientId ]
	);
	const hasBlockVisibilityButtonShownRef = useRef( false );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// If the block visibility button has been shown, we don't want to
	// remove it from the toolbar until the toolbar is rendered again
	// without it. Removing it beforehand can cause focus loss issues.
	// It needs to return focus from whence it came, and to do that,
	// we need to leave the button in the toolbar.
	useEffect( () => {
		if ( isBlockHidden ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ isBlockHidden ] );

	if ( ! isBlockHidden && ! hasBlockVisibilityButtonShownRef.current ) {
		return null;
	}

	const label = isBlockHidden ? __( 'Show' ) : __( 'Hide' );

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					disabled={ ! canToggleBlockVisibility }
					icon={ isBlockHidden ? unseen : seen }
					label={ label }
					onClick={ () => {
						const newBlockHidden = ! isBlockHidden;
						updateBlockAttributes( [ clientId ], {
							metadata: {
								blockVisibility: newBlockHidden
									? false
									: undefined,
							},
						} );
					} }
				/>
			</ToolbarGroup>
		</>
	);
}
