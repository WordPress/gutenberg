/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { useShowMoversGestures } from '../block-toolbar/utils';

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {WPComponent} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		'core/block-editor'
	);
	const {
		parentBlockType,
		firstParentClientId,
		shouldHide,
		hasReducedUI,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientId,
			getSettings,
		} = select( 'core/block-editor' );
		const { hasBlockSupport } = select( blocksStore );
		const selectedBlockClientId = getSelectedBlockClientId();
		const parents = getBlockParents( selectedBlockClientId );
		const _firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( _firstParentClientId );
		const _parentBlockType = getBlockType( parentBlockName );
		const settings = getSettings();
		return {
			parentBlockType: _parentBlockType,
			firstParentClientId: _firstParentClientId,
			shouldHide: ! hasBlockSupport(
				_parentBlockType,
				'__experimentalParentSelector',
				true
			),
			hasReducedUI: settings.hasReducedUI,
		};
	}, [] );

	const nodeRef = useRef();
	const { gestures: showMoversGestures } = useShowMoversGestures( {
		ref: nodeRef,
		onChange( isFocused ) {
			if ( isFocused && hasReducedUI ) {
				return;
			}
			toggleBlockHighlight( firstParentClientId, isFocused );
		},
	} );

	if ( shouldHide ) {
		return null;
	}

	if ( firstParentClientId !== undefined ) {
		return (
			<div
				className="block-editor-block-parent-selector"
				key={ firstParentClientId }
				ref={ nodeRef }
				{ ...showMoversGestures }
			>
				<ToolbarButton
					className="block-editor-block-parent-selector__button"
					onClick={ () => selectBlock( firstParentClientId ) }
					label={ sprintf(
						/* translators: %s: Name of the block's parent. */
						__( 'Select %s' ),
						parentBlockType.title
					) }
					showTooltip
					icon={ <BlockIcon icon={ parentBlockType.icon } /> }
				/>
			</div>
		);
	}

	return null;
}
