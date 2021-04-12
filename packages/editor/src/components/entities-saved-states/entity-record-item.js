/**
 * WordPress dependencies
 */
import { CheckboxControl, Button, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const TRANSLATED_SITE_PROTPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	sitelogo: __( 'Logo' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

export default function EntityRecordItem( {
	record,
	checked,
	onChange,
	closePanel,
} ) {
	const { name, kind, title, key } = record;
	const parentBlockId = useSelect( ( select ) => {
		// Get entity's blocks.
		const { blocks = [] } = select( coreStore ).getEditedEntityRecord(
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
			const editedEntity = select( coreStore ).getEditedEntityRecord(
				kind,
				name,
				key
			);

			if ( 'postType' === kind && 'wp_template' === name ) {
				return select( editorStore ).__experimentalGetTemplateInfo(
					editedEntity
				).title;
			}

			const entity = select( coreStore ).getEntityRecord(
				kind,
				name,
				key
			);

			// Determine which sections of the site object have been changed.
			if ( 'root' === kind && 'site' === name ) {
				const editedSiteProperties = [];
				for ( const field in editedEntity ) {
					if ( editedEntity[ field ] !== entity[ field ] ) {
						editedSiteProperties.push(
							TRANSLATED_SITE_PROTPERTIES[ field ] || field
						);
					}
				}

				return editedSiteProperties.join( ', ' );
			}

			return title;
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
