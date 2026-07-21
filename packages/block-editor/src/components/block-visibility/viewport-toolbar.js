/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { deviceTypeKey } from '../../store/private-keys';
import { unlock } from '../../lock-unlock';
import { useSettings } from '../use-settings';
import { getBlockVisibilityCondition } from './utils';

export default function BlockVisibilityViewportToolbar( { clientIds } ) {
	const hasBlockVisibilityButtonShownRef = useRef( false );
	const [ blockVisibility ] = useSettings( 'blockVisibility.allowEditing' );
	const { canToggleBlockVisibility, areBlocksHiddenAnywhere, ghostReason } =
		useSelect(
			( select ) => {
				const { getSettings, getBlockAttributes } =
					select( blockEditorStore );
				const {
					getBlocksByClientId,
					getBlockName,
					isBlockHiddenAnywhere,
					isBlockGhosted,
				} = unlock( select( blockEditorStore ) );
				const _blocks = getBlocksByClientId( clientIds );

				// While a single ghosted block is selected it renders at full
				// opacity, so the toolbar states why it's hidden in the
				// previewed context.
				let _ghostReason = null;
				if (
					clientIds?.length === 1 &&
					isBlockGhosted( clientIds[ 0 ] )
				) {
					const settings = getSettings();
					_ghostReason = getBlockVisibilityCondition(
						getBlockAttributes( clientIds[ 0 ] )?.metadata
							?.blockVisibility,
						settings[ deviceTypeKey ]?.toLowerCase() || 'desktop',
						settings.__experimentalFeatures?.viewport
					)?.label;
				}

				return {
					canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
						hasBlockSupport(
							getBlockName( clientId ),
							'visibility',
							true
						)
					),
					areBlocksHiddenAnywhere: clientIds?.every( ( clientId ) =>
						isBlockHiddenAnywhere( clientId )
					),
					ghostReason: _ghostReason,
				};
			},

			[ clientIds ]
		);
	const blockEditorDispatch = useDispatch( blockEditorStore );

	/*
	 * If the block visibility button has been shown, we don't want to
	 * remove it from the toolbar until the toolbar is rendered again
	 * without it. Removing it beforehand can cause focus loss issues.
	 * It needs to return focus from whence it came, and to do that,
	 * we need to leave the button in the toolbar.
	 */
	useEffect( () => {
		if ( areBlocksHiddenAnywhere ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ areBlocksHiddenAnywhere ] );

	if ( blockVisibility === false ) {
		return null;
	}

	if (
		! areBlocksHiddenAnywhere &&
		! hasBlockVisibilityButtonShownRef.current
	) {
		return null;
	}

	const { showViewportModal } = unlock( blockEditorDispatch );

	return (
		<ToolbarGroup className="block-editor-block-visibility-toolbar">
			<ToolbarButton
				disabled={ ! canToggleBlockVisibility }
				icon={ areBlocksHiddenAnywhere ? unseen : seen }
				label={
					areBlocksHiddenAnywhere ? __( 'Hidden' ) : __( 'Visible' )
				}
				onClick={ () => showViewportModal( clientIds ) }
				aria-haspopup="dialog"
			/>
			{ ghostReason && (
				<span className="block-editor-block-visibility-toolbar__reason">
					{ ghostReason }
				</span>
			) }
		</ToolbarGroup>
	);
}
