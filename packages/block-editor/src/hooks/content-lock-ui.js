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

function StopEditingAsBlocksOnOutsideSelect( {
	clientId,
	lock,
	setIsEditingAsBlocks,
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
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		if ( ! isBlockOrDescendantSelected ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( clientId, {
				lock: {
					...lock,
					content: true,
				},
			} );
			setIsEditingAsBlocks( false );
		}
	}, [ isBlockOrDescendantSelected ] );
	return null;
}

export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const [ isEditingAsBlocks, setIsEditingAsBlocks ] = useState( false );
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

		if ( ! isContentLocked && ! isEditingAsBlocks ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				{ isEditingAsBlocks && ! isContentLocked && (
					<StopEditingAsBlocksOnOutsideSelect
						clientId={ props.clientId }
						lock={ lock }
						setIsEditingAsBlocks={ setIsEditingAsBlocks }
					/>
				) }
				<BlockControls group="other">
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => {
								if ( isEditingAsBlocks && ! isContentLocked ) {
									__unstableMarkNextChangeAsNotPersistent();
									updateBlockAttributes( props.clientId, {
										lock: {
											...lock,
											content: true,
										},
									} );
									setIsEditingAsBlocks( false );
								} else {
									const newLock = { ...lock };
									delete newLock.content;
									__unstableMarkNextChangeAsNotPersistent();
									updateBlockAttributes( props.clientId, {
										lock: newLock,
									} );
									setIsEditingAsBlocks( true );
								}
							} }
						>
							{ isEditingAsBlocks && ! isContentLocked
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
