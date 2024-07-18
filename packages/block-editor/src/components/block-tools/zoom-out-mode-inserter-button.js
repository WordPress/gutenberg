/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserterButton( {
	previousClientId,
	nextClientId,
	index,
} ) {
	const {
		sectionRootClientId,
		setInserterIsOpened,
		hasSelection,
		selectedBlockClientId,
		hoveredBlock,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getSelectionStart,
			getSelectedBlockClientId,
			getHoveredBlock,
		} = select( blockEditorStore );
		const { sectionRootClientId: root } = unlock( getSettings() );

		return {
			hasSelection: !! getSelectionStart().clientId,
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			hoveredBlock: getHoveredBlock(),
		};
	}, [] );

	const isSelected =
		hasSelection &&
		( selectedBlockClientId === previousClientId ||
			selectedBlockClientId === nextClientId );

	const isHovered =
		hoveredBlock === previousClientId || hoveredBlock === nextClientId;

	const [
		zoomOutModeInserterButtonHovered,
		setZoomOutModeInserterButtonHovered,
	] = useState( false );

	return (
		<Button
			variant="primary"
			icon={ plus }
			size="compact"
			className={ clsx(
				'block-editor-button-pattern-inserter__button',
				'block-editor-block-tools__zoom-out-mode-inserter-button',
				{
					'is-visible':
						isHovered ||
						isSelected ||
						zoomOutModeInserterButtonHovered,
				}
			) }
			onClick={ () => {
				setInserterIsOpened( {
					rootClientId: sectionRootClientId,
					insertionIndex: index,
					tab: 'patterns',
					category: 'all',
				} );
			} }
			onMouseOver={ () => {
				setZoomOutModeInserterButtonHovered( true );
			} }
			onMouseOut={ () => {
				setZoomOutModeInserterButtonHovered( false );
			} }
			label={ _x(
				'Add pattern',
				'Generic label for pattern inserter button'
			) }
		/>
	);
}

export default ZoomOutModeInserterButton;
