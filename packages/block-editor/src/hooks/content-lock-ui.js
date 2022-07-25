/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls } from '../components';

function StopEdingAsBlockOnOutsideSelect( {
	clientId,
	lock,
	setIsTemporarlyEditingAsBlocks,
} ) {
	const isBlockOrDescendSelected = useSelect(
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
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		if ( ! isBlockOrDescendSelected ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( clientId, {
				lock: {
					...lock,
					content: true,
				},
			} );
			setIsTemporarlyEditingAsBlocks( false );
		}
	}, [ isBlockOrDescendSelected ] );
	return null;
}

export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const [ isTemporarlyEditingAsBlocks, setIsTemporarlyEditingAsBlocks ] =
			useState( false );
		const lock = useSelect(
			( select ) =>
				select( blockEditorStore ).getBlockAttributes( props.clientId )
					.lock,
			[ props.clientId ]
		);
		const isContentLocked = lock?.content === true;
		const {
			__unstableMarkNextChangeAsNotPersistent,
			updateBlockAttributes,
		} = useDispatch( blockEditorStore );
		if ( ! isContentLocked && ! isTemporarlyEditingAsBlocks ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<>
				{ isTemporarlyEditingAsBlocks && ! isContentLocked && (
					<StopEdingAsBlockOnOutsideSelect
						clientId={ props.clientId }
						lock={ lock }
						setIsTemporarlyEditingAsBlocks={
							setIsTemporarlyEditingAsBlocks
						}
					/>
				) }
				<BlockControls group="other">
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => {
								if (
									isTemporarlyEditingAsBlocks &&
									! isContentLocked
								) {
									__unstableMarkNextChangeAsNotPersistent();
									updateBlockAttributes( props.clientId, {
										lock: {
											...lock,
											content: true,
										},
									} );
									setIsTemporarlyEditingAsBlocks( false );
								} else {
									const newLock = { ...lock };
									delete newLock.content;
									__unstableMarkNextChangeAsNotPersistent();
									updateBlockAttributes( props.clientId, {
										lock: newLock,
									} );
									setIsTemporarlyEditingAsBlocks( true );
								}
							} }
						>
							{ isTemporarlyEditingAsBlocks && ! isContentLocked
								? __( ' Finish editing as blocks' )
								: __( 'Edit as Blocks' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
				<BlockEdit { ...props } />
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
