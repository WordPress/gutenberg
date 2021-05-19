/**
 * WordPress dependencies
 */
import { CheckboxControl, Button, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function EntityRecordItem( {
	record,
	checked,
	onChange,
	closePanel,
} ) {
	const { name, kind, title, key } = record;
	const parentBlockId = useSelect( ( select ) => {
		// Get entity's blocks.
		const { blocks = [] } = select( 'core' ).getEditedEntityRecord(
			kind,
			name,
			key
		);
		// Get parents of the entity's first block.
		const parents = select( blockEditorStore ).getBlockParents(
			blocks[ 0 ]?.clientId
		);
		// Return closest parent block's clientId.
		return parents[ parents.length - 1 ];
	}, [] );

	// Handle templates that might use default descriptive titles
	const entityRecordTitle = useSelect(
		( select ) => {
			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return title;
			}

			const template = select( 'core' ).getEditedEntityRecord(
				kind,
				name,
				key
			);
			return select( 'core/editor' ).__experimentalGetTemplateInfo(
				template
			).title;
		},
		[ name, kind, title, key ]
	);

	const isSelected = useSelect(
		( select ) => {
			const selectedBlockId = select(
				blockEditorStore
			).getSelectedBlockClientId();
			return selectedBlockId === parentBlockId;
		},
		[ parentBlockId ]
	);
	const isSelectedText = isSelected ? __( 'Selected' ) : __( 'Select' );
	const { selectBlock } = useDispatch( blockEditorStore );
	const selectParentBlock = useCallback( () => selectBlock( parentBlockId ), [
		parentBlockId,
	] );
	const selectAndDismiss = useCallback( () => {
		selectBlock( parentBlockId );
		closePanel();
	}, [ parentBlockId ] );

	return (
		<PanelRow>
			<CheckboxControl
				label={
					<strong>{ entityRecordTitle || __( 'Untitled' ) }</strong>
				}
				checked={ checked }
				onChange={ onChange }
			/>
			{ parentBlockId ? (
				<>
					<Button
						onClick={ selectParentBlock }
						className="entities-saved-states__find-entity"
						disabled={ isSelected }
					>
						{ isSelectedText }
					</Button>
					<Button
						onClick={ selectAndDismiss }
						className="entities-saved-states__find-entity-small"
						disabled={ isSelected }
					>
						{ isSelectedText }
					</Button>
				</>
			) : null }
		</PanelRow>
	);
}
