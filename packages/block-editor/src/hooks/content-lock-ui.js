/**
 * WordPress dependencies
 */
import { ToolbarButton, MenuItem } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { store as blocksStore, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls, BlockSettingsMenuControls } from '../components';
import {
	flattenBlocks,
	replaceContentsInBlocks,
	areBlocksAlike,
} from './utils';
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

function filterBlocksForShuffle( blocks ) {
	return flattenBlocks( blocks ).filter( ( block ) => {
		const blockType = getBlockType( block.name );

		return blockType.category !== 'design';
	} );
}

function compareFilteredBlocks( sourceBlocks, targetBlocks ) {
	if ( sourceBlocks.length !== targetBlocks.length ) {
		return false;
	}

	const targetBlockNames = {};
	for ( const targetBlock of targetBlocks ) {
		targetBlockNames[ targetBlock.name ] ??= 0;
		targetBlockNames[ targetBlock.name ] += 1;
	}

	for ( const sourceBlock of sourceBlocks ) {
		if ( ! targetBlockNames[ sourceBlock.name ] ) {
			return false;
		}

		targetBlockNames[ sourceBlock.name ] -= 1;
	}

	return true;
}

function ShufflePatternsToolbarItem( { clientId } ) {
	// TODO: Probably worth to add this to blocks' selectors.
	const getFlattenContentBlocks = useSelect( ( select ) => {
		const contentBlockNames = select( blocksStore )
			.getBlockTypes()
			.filter(
				( blockType ) =>
					blockType.name !== 'core/list-item' &&
					Object.values( blockType.attributes ).some(
						( attribute ) =>
							attribute.__experimentalRole === 'content'
					)
			)
			.map( ( blockType ) => blockType.name );

		return ( blocks ) =>
			flattenBlocks( blocks ).filter( ( block ) =>
				contentBlockNames.includes( block.name )
			);
	}, [] );
	const { contentBlocks, patterns } = useSelect(
		( select ) => {
			const blocks =
				select( blockEditorStore ).getBlocksByClientId( clientId );
			const filteredBlocks = filterBlocksForShuffle( blocks );
			const _contentBlocks = getFlattenContentBlocks( blocks );
			const allPatterns =
				select( blockEditorStore ).__experimentalGetAllowedPatterns();

			return {
				contentBlocks: _contentBlocks,
				patterns: allPatterns
					.filter( ( pattern ) => {
						const filteredPatternBlocks = filterBlocksForShuffle(
							pattern.blocks
						);
						return compareFilteredBlocks(
							filteredBlocks,
							filteredPatternBlocks
						);
					} )
					.filter(
						( pattern ) =>
							! areBlocksAlike( blocks, pattern.blocks )
					),
			};
		},
		[ clientId, getFlattenContentBlocks ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	function shuffle() {
		// We're not using `Math.random` for instance ids here.
		// eslint-disable-next-line no-restricted-syntax
		const randomNumber = Math.floor( Math.random() * patterns.length );
		const pattern = patterns[ randomNumber ];
		const replacedPatternBlocks = replaceContentsInBlocks(
			pattern.blocks,
			contentBlocks
		).map( ( block ) => {
			block.attributes.templateLock = 'contentOnly';
			return block;
		} );
		replaceBlocks( clientId, replacedPatternBlocks );
	}

	if ( patterns.length === 0 ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarButton onClick={ shuffle }>
				{ __( 'Shuffle' ) }
			</ToolbarButton>
		</BlockControls>
	);
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

		return (
			<>
				{ isEditingAsBlocks && ! isContentLocked && (
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
				{ ! isEditingAsBlocks && isContentLocked && props.isSelected && (
					<>
						<BlockSettingsMenuControls>
							{ ( { onClose } ) => (
								<MenuItem
									onClick={ () => {
										__unstableMarkNextChangeAsNotPersistent();
										updateBlockAttributes( props.clientId, {
											templateLock: undefined,
										} );
										updateBlockListSettings(
											props.clientId,
											{
												...getBlockListSettings(
													props.clientId
												),
												templateLock: false,
											}
										);
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

						<ShufflePatternsToolbarItem
							clientId={ props.clientId }
						/>
					</>
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
	'core/style/with-block-controls',
	withBlockControls
);
