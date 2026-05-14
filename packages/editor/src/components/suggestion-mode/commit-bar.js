/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { operationsFromOverlay, useSuggestionsProvider } from './provider';
import { EDITOR_STORE_NAME } from './constants';

/**
 * Block toolbar group that surfaces Submit / Discard controls whenever the
 * currently selected block has a pending suggestion overlay.
 *
 * The bar is a shared singleton — mounted once per editor provider rather
 * than once per block — because the block-editor's `BlockControls` fill
 * automatically targets the selected block's toolbar slot.
 *
 * @return {React.ReactNode|null} Toolbar markup, or null if nothing pending.
 */
export default function SuggestionCommitBar() {
	const { entries, clearOverlay } = useSuggestionOverlay();
	const { createSuggestion } = useSuggestionsProvider();

	const { selectedClientId, isSuggestMode } = useSelect( ( select ) => {
		return {
			selectedClientId:
				select( blockEditorStore ).getSelectedBlockClientId(),
			isSuggestMode:
				select( EDITOR_STORE_NAME ).getEditorIntent?.() === 'suggest',
		};
	}, [] );

	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const entry = selectedClientId ? entries[ selectedClientId ] : null;
	const hasOverlay =
		!! entry && Object.keys( entry.overlayAttributes ).length > 0;

	const onSubmit = useCallback( async () => {
		if ( ! entry || isSubmitting ) {
			return;
		}
		const operations = operationsFromOverlay(
			entry.baselineAttributes,
			entry.overlayAttributes
		);
		if ( operations.length === 0 ) {
			clearOverlay( selectedClientId );
			return;
		}
		setIsSubmitting( true );
		try {
			await createSuggestion( {
				clientId: selectedClientId,
				blockName: entry.blockName,
				operations,
			} );
			clearOverlay( selectedClientId );
		} catch {
			// Notice surfaced by the provider.
		} finally {
			setIsSubmitting( false );
		}
	}, [
		entry,
		isSubmitting,
		selectedClientId,
		clearOverlay,
		createSuggestion,
	] );

	const onDiscard = useCallback( () => {
		if ( selectedClientId ) {
			clearOverlay( selectedClientId );
		}
	}, [ selectedClientId, clearOverlay ] );

	if ( ! isSuggestMode || ! hasOverlay ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					variant="primary"
					onClick={ onSubmit }
					disabled={ isSubmitting }
				>
					{ isSubmitting
						? __( 'Submitting…' )
						: __( 'Submit suggestion' ) }
				</ToolbarButton>
				<ToolbarButton onClick={ onDiscard } disabled={ isSubmitting }>
					{ __( 'Discard' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
