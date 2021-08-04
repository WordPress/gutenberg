/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { ToolbarButton, Slot } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import { useShowMoversGestures } from '../block-toolbar/utils';
import { store as blockEditorStore } from '../../store';

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {WPComponent} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const { firstParentClientId, shouldHide, hasReducedUI } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockParents,
				getSelectedBlockClientId,
				getSettings,
			} = select( blockEditorStore );
			const { hasBlockSupport } = select( blocksStore );
			const selectedBlockClientId = getSelectedBlockClientId();
			const parents = getBlockParents( selectedBlockClientId );
			const _firstParentClientId = parents[ parents.length - 1 ];
			const parentBlockName = getBlockName( _firstParentClientId );
			const _parentBlockType = getBlockType( parentBlockName );
			const settings = getSettings();

			return {
				firstParentClientId: _firstParentClientId,
				shouldHide: ! hasBlockSupport(
					_parentBlockType,
					'__experimentalParentSelector',
					true
				),
				hasReducedUI: settings.hasReducedUI,
			};
		},
		[]
	);
	const blockInformation = useBlockDisplayInformation( firstParentClientId );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
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

	// states to check reusable block edits
	const [ reusableBlockHasEdits, setReusableBlockHasEdits ] = useState(
		false
	);

	if ( shouldHide || firstParentClientId === undefined ) {
		return null;
	}

	const classes = classnames( 'block-editor-block-parent-selector', {
		'parent-block-has-changes': reusableBlockHasEdits,
	} );

	return (
		<div
			className={ classes }
			key={ firstParentClientId }
			ref={ nodeRef }
			{ ...showMoversGestures }
		>
			{ /* Update the reusableBlockHasEdits state in BlockHasDot using Slot/Fill to update the parent-selector classes and to add dot to parent selector.  */ }
			<Slot
				name="parent-selector-has-dot"
				fillProps={ {
					setReusableBlockHasEdits,
				} }
			></Slot>
			{ /* Add dot to the parent selector if it is a reusable block and if the reusable block has edits. */ }
			{ reusableBlockHasEdits && (
				<div className="block-parent-selector-has-dot"></div>
			) }

			<ToolbarButton
				className="block-editor-block-parent-selector__button"
				onClick={ () => selectBlock( firstParentClientId ) }
				label={ sprintf(
					/* translators: %s: Name of the block's parent. */
					__( 'Select %s' ),
					blockInformation.title
				) }
				showTooltip
				icon={ <BlockIcon icon={ blockInformation.icon } /> }
			/>
		</div>
	);
}
