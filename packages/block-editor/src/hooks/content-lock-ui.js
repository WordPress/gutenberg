/**
 * WordPress dependencies
 */
import { ToolbarButton, MenuItem } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls, BlockSettingsMenuControls } from '../components';
/**
 * External dependencies
 */
import classnames from 'classnames';

function StopEditingAsBlocksOnOutsideSelect( {
	clientId,
	stopEditingAsBlock,
} ) {
	const isBlockOrDescendantSelected = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );
			return (
				isBlockSelected( clientId ) ||
				hasSelectedInnerBlock( clientId, true )
			);
		},
		[ clientId ]
	);
	useEffect( () => {
		if ( ! isBlockOrDescendantSelected ) {
			stopEditingAsBlock();
		}
	}, [ isBlockOrDescendantSelected ] );
	return null;
}

export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { getBlockListSettings, getSettings } =
			useSelect( blockEditorStore );
		const focusModeToRevert = useRef();
		const { templateLock, isLockedByParent, isEditingAsBlocks } = useSelect(
			( select ) => {
				const {
					__unstableGetContentLockingParent,
					getTemplateLock,
					__unstableGetTemporarilyEditingAsBlocks,
				} = select( blockEditorStore );
				return {
					templateLock: getTemplateLock( props.clientId ),
					isLockedByParent: !! __unstableGetContentLockingParent(
						props.clientId
					),
					isEditingAsBlocks:
						__unstableGetTemporarilyEditingAsBlocks() ===
						props.clientId,
				};
			},
			[ props.clientId ]
		);

		const {
			updateSettings,
			updateBlockListSettings,
			__unstableSetTemporarilyEditingAsBlocks,
		} = useDispatch( blockEditorStore );
		const isContentLocked =
			! isLockedByParent && templateLock === 'contentOnly';
		const {
			__unstableMarkNextChangeAsNotPersistent,
			updateBlockAttributes,
		} = useDispatch( blockEditorStore );

		const stopEditingAsBlock = useCallback( () => {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( props.clientId, {
				templateLock: 'contentOnly',
			} );
			updateBlockListSettings( props.clientId, {
				...getBlockListSettings( props.clientId ),
				templateLock: 'contentOnly',
			} );
			updateSettings( { focusMode: focusModeToRevert.current } );
			__unstableSetTemporarilyEditingAsBlocks();
		}, [
			props.clientId,
			focusModeToRevert,
			updateSettings,
			updateBlockListSettings,
			getBlockListSettings,
			__unstableMarkNextChangeAsNotPersistent,
			updateBlockAttributes,
			__unstableSetTemporarilyEditingAsBlocks,
		] );

		if ( ! isContentLocked && ! isEditingAsBlocks ) {
			return <BlockEdit { ...props } />;
		}

		const showStopEditingAsBlocks = isEditingAsBlocks && ! isContentLocked;
		const showStartEditingAsBlocks =
			! isEditingAsBlocks && isContentLocked && props.isSelected;

		return (
			<>
				{ showStopEditingAsBlocks && (
					<>
						<StopEditingAsBlocksOnOutsideSelect
							clientId={ props.clientId }
							stopEditingAsBlock={ stopEditingAsBlock }
						/>
						<BlockControls group="other">
							<ToolbarButton
								onClick={ () => {
									stopEditingAsBlock();
								} }
							>
								{ __( 'Done' ) }
							</ToolbarButton>
						</BlockControls>
					</>
				) }
				{ showStartEditingAsBlocks && (
					<BlockSettingsMenuControls>
						{ ( { onClose } ) => (
							<MenuItem
								onClick={ () => {
									__unstableMarkNextChangeAsNotPersistent();
									updateBlockAttributes( props.clientId, {
										templateLock: undefined,
									} );
									updateBlockListSettings( props.clientId, {
										...getBlockListSettings(
											props.clientId
										),
										templateLock: false,
									} );
									focusModeToRevert.current =
										getSettings().focusMode;
									updateSettings( { focusMode: true } );
									__unstableSetTemporarilyEditingAsBlocks(
										props.clientId
									);
									onClose();
								} }
							>
								{ __( 'Modify' ) }
							</MenuItem>
						) }
					</BlockSettingsMenuControls>
				) }
				<BlockEdit
					{ ...props }
					className={ classnames(
						props.className,
						isEditingAsBlocks &&
							'is-content-locked-editing-as-blocks'
					) }
				/>
			</>
		);
	},
	'withToolbarControls'
);

addFilter(
	'editor.BlockEdit',
	'core/content-lock-ui/with-block-controls',
	withBlockControls
);
