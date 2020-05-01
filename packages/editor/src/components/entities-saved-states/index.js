/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	CheckboxControl,
	Button,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import {
	close as closeIcon,
	page,
	layout,
	grid,
	blockDefault,
} from '@wordpress/icons';

const ENTITY_NAME_ICONS = {
	site: layout,
	page,
	post: grid,
	wp_template: grid,
};

function EntityRecordState( { record, checked, onChange, closePanel } ) {
	const { name, kind, title, key } = record;
	const parentBlockId = useSelect( ( select ) => {
		// Get entity's blocks.
		const { blocks = [] } = select( 'core' ).getEditedEntityRecord(
			kind,
			name,
			key
		);
		// Get parents of the entity's first block.
		const parents = select( 'core/block-editor' ).getBlockParents(
			blocks[ 0 ]?.clientId
		);
		// Return closest parent block's clientId.
		return parents[ parents.length - 1 ];
	}, [] );

	const isSelected = useSelect(
		( select ) => {
			const selectedBlockId = select(
				'core/block-editor'
			).getSelectedBlockClientId();
			return selectedBlockId === parentBlockId;
		},
		[ parentBlockId ]
	);
	const isSelectedText = isSelected ? __( 'Selected' ) : __( 'Select' );
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const selectParentBlock = useCallback( () => selectBlock( parentBlockId ), [
		parentBlockId,
	] );
	const selectAndDismiss = useCallback( () => {
		selectBlock( parentBlockId );
		closePanel();
	}, [ parentBlockId ] );

	// Save-As stuff
	const canSaveAs = name === 'wp_template' || name === 'wp_template_part';
	const [ savingAs, setSavingAs ] = useState( false );
	const toggleSavingAs = useCallback( () => setSavingAs( ! savingAs ), [
		savingAs,
	] );
	const [ slug, setSlug ] = useState( '' );
	const [ theme, setTheme ] = useState( '' );
	const comboInUse = useSelect(
		( select ) => {
			// Find match for entity slug/theme
			if ( ! ( canSaveAs && slug && theme ) ) {
				return true;
			}

			const posts = select( 'core' ).getEntityRecords( 'postType', name, {
				status: [ 'publish', 'auto-draft' ],
				slug,
				theme,
			} );
			const foundPosts = posts?.filter(
				( post ) =>
					post.slug === slug && post.meta && post.meta.theme === theme
			);
			const foundPost =
				foundPosts?.find( ( post ) => post.status === 'publish' ) ||
				foundPosts?.find( ( post ) => post.status === 'auto-draft' );

			return !! foundPost?.id;
		},
		[ slug, theme ]
	);

	return (
		<>
			<PanelRow>
				<CheckboxControl
					label={ <strong>{ title || __( 'Untitled' ) }</strong> }
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
			<PanelRow>
				{ canSaveAs && ! savingAs && (
					<Button
						onClick={ toggleSavingAs }
						className="entities-saved-states__save-as"
					>
						{ __( 'Save as…' ) }
					</Button>
				) }
			</PanelRow>
			{ savingAs && (
				<>
					<hr />
					<h3>
						{ __( 'Enter a new Slug and Theme combo to save as:' ) }
					</h3>

					<TextControl
						label={ __( 'New Slug' ) }
						placeholder={ __( 'header' ) }
						value={ slug }
						onChange={ setSlug }
						// help={ help }
						className="wp-block-template-part__placeholder-input"
					/>
					<TextControl
						label={ __( 'Theme' ) }
						placeholder={ __( 'twentytwenty' ) }
						value={ theme }
						onChange={ setTheme }
						className="wp-block-template-part__placeholder-input"
					/>

					{ slug && theme && (
						<>
							{ comboInUse ? (
								<h3>{ __( 'Slug/Theme combo in use' ) }</h3>
							) : (
								<h3>{ __( 'Slug/Theme combo Available!' ) }</h3>
							) }
						</>
					) }
					<PanelRow>
						<Button
							disabled={ comboInUse }
							onClick={ toggleSavingAs }
							isPrimary
							className="entities-saved-states__save-as-button"
						>
							{ __( 'Save as…' ) }
						</Button>
						<Button
							onClick={ toggleSavingAs }
							className="entities-saved-states__cancel-save-as-button"
						>
							{ __( 'Cancel' ) }
						</Button>
					</PanelRow>
				</>
			) }
		</>
	);
}

function EntityTypeList( {
	list,
	unselectedEntities,
	setUnselectedEntities,
	closePanel,
} ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( 'core' ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	// Set icon based on type of entity.
	const { name } = firstRecord;
	const icon = ENTITY_NAME_ICONS[ name ] || blockDefault;

	return (
		<PanelBody title={ entity.label } initialOpen={ true } icon={ icon }>
			{ list.map( ( record ) => {
				return (
					<EntityRecordState
						key={ record.key || 'site' }
						record={ record }
						checked={
							! some(
								unselectedEntities,
								( elt ) =>
									elt.kind === record.kind &&
									elt.name === record.name &&
									elt.key === record.key
							)
						}
						onChange={ ( value ) =>
							setUnselectedEntities( record, value )
						}
						closePanel={ closePanel }
					/>
				);
			} ) }
		</PanelBody>
	);
}

export default function EntitiesSavedStates( { isOpen, close } ) {
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		return {
			dirtyEntityRecords: select(
				'core'
			).__experimentalGetDirtyEntityRecords(),
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( dirtyEntityRecords, 'name' )
	);

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					unselectedEntities,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );

		close( entitiesToSave );
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	return isOpen ? (
		<div className="entities-saved-states__panel">
			<div className="entities-saved-states__panel-header">
				<Button
					onClick={ dismissPanel }
					icon={ closeIcon }
					label={ __( 'Close panel' ) }
				/>
			</div>

			<div className="entities-saved-states__text-prompt">
				<h2>
					{ __( 'Please review the following changes to save:' ) }
				</h2>
			</div>

			{ partitionedSavables.map( ( list ) => {
				return (
					<EntityTypeList
						key={ list[ 0 ].name }
						list={ list }
						closePanel={ dismissPanel }
						unselectedEntities={ unselectedEntities }
						setUnselectedEntities={ setUnselectedEntities }
					/>
				);
			} ) }

			<Button
				isPrimary
				disabled={
					dirtyEntityRecords.length - unselectedEntities.length === 0
				}
				onClick={ saveCheckedEntities }
				className="editor-entities-saved-states__save-button"
			>
				{ __( 'Save selected items' ) }
			</Button>
		</div>
	) : null;
}
