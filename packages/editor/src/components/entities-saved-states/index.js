/**
 * WordPress dependencies
 */
import { Button, Flex, FlexItem } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import {
	__experimentalUseDialog as useDialog,
	useInstanceId,
} from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';
import { useIsDirty } from './hooks/use-is-dirty';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function identity( values ) {
	return values;
}

export default function EntitiesSavedStates( {
	close,
	renderDialog = undefined,
} ) {
	const isDirtyProps = useIsDirty();
	return (
		<EntitiesSavedStatesExtensible
			close={ close }
			renderDialog={ renderDialog }
			{ ...isDirtyProps }
		/>
	);
}

export function EntitiesSavedStatesExtensible( {
	additionalPrompt = undefined,
	close,
	onSave = identity,
	saveEnabled: saveEnabledProp = undefined,
	saveLabel = __( 'Save' ),
	renderDialog = undefined,
	dirtyEntityRecords,
	isDirty,
	setUnselectedEntities,
	unselectedEntities,
} ) {
	const saveButtonRef = useRef();
	const { saveDirtyEntities } = unlock( useDispatch( editorStore ) );
	// To group entities by type.
	const partitionedSavables = dirtyEntityRecords.reduce( ( acc, record ) => {
		const { name } = record;
		if ( ! acc[ name ] ) {
			acc[ name ] = [];
		}
		acc[ name ].push( record );
		return acc;
	}, {} );

	// Sort entity groups.
	const {
		site: siteSavables,
		wp_template: templateSavables,
		wp_template_part: templatePartSavables,
		...contentSavables
	} = partitionedSavables;
	const sortedPartitionedSavables = [
		siteSavables,
		templateSavables,
		templatePartSavables,
		...Object.values( contentSavables ),
	].filter( Array.isArray );

	const saveEnabled = saveEnabledProp ?? isDirty;
	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	const [ saveDialogRef, saveDialogProps ] = useDialog( {
		onClose: () => dismissPanel(),
	} );
	const dialogLabel = useInstanceId( EntitiesSavedStatesExtensible, 'label' );
	const dialogDescription = useInstanceId(
		EntitiesSavedStatesExtensible,
		'description'
	);

	return (
		<div
			ref={ saveDialogRef }
			{ ...saveDialogProps }
			className="entities-saved-states__panel"
			role={ renderDialog ? 'dialog' : undefined }
			aria-labelledby={ renderDialog ? dialogLabel : undefined }
			aria-describedby={ renderDialog ? dialogDescription : undefined }
		>
			<Flex className="entities-saved-states__panel-header" gap={ 2 }>
				<FlexItem
					isBlock
					as={ Button }
					ref={ saveButtonRef }
					variant="primary"
					disabled={ ! saveEnabled }
					__experimentalIsFocusable
					onClick={ () =>
						saveDirtyEntities( {
							onSave,
							dirtyEntityRecords,
							entitiesToSkip: unselectedEntities,
							close,
						} )
					}
					className="editor-entities-saved-states__save-button"
				>
					{ saveLabel }
				</FlexItem>
				<FlexItem
					isBlock
					as={ Button }
					variant="secondary"
					onClick={ dismissPanel }
				>
					{ __( 'Cancel' ) }
				</FlexItem>
			</Flex>

			<div className="entities-saved-states__text-prompt">
				<div
					className="entities-saved-states__text-prompt--header-wrapper"
					id={ renderDialog ? dialogLabel : undefined }
				>
					<strong className="entities-saved-states__text-prompt--header">
						{ __( 'Are you ready to save?' ) }
					</strong>
					{ additionalPrompt }
				</div>
				<p id={ renderDialog ? dialogDescription : undefined }>
					{ isDirty
						? createInterpolateElement(
								sprintf(
									/* translators: %d: number of site changes waiting to be saved. */
									_n(
										'There is <strong>%d site change</strong> waiting to be saved.',
										'There are <strong>%d site changes</strong> waiting to be saved.',
										sortedPartitionedSavables.length
									),
									sortedPartitionedSavables.length
								),
								{ strong: <strong /> }
						  )
						: __( 'Select the items you want to save.' ) }
				</p>
			</div>

			{ sortedPartitionedSavables.map( ( list ) => {
				return (
					<EntityTypeList
						key={ list[ 0 ].name }
						list={ list }
						unselectedEntities={ unselectedEntities }
						setUnselectedEntities={ setUnselectedEntities }
					/>
				);
			} ) }
		</div>
	);
}
