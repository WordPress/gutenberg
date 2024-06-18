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

/**
 * Renders the component for managing saved states of entities.
 *
 * @param {Object}   props              The component props.
 * @param {Function} props.close        The function to close the dialog.
 * @param {Function} props.renderDialog The function to render the dialog.
 *
 * @return {JSX.Element} The rendered component.
 */
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

/**
 * Renders a panel for saving entities with dirty records.
 *
 * @param {Object}   props                       The component props.
 * @param {string}   props.additionalPrompt      Additional prompt to display.
 * @param {Function} props.close                 Function to close the panel.
 * @param {Function} props.onSave                Function to call when saving entities.
 * @param {boolean}  props.saveEnabled           Flag indicating if save is enabled.
 * @param {string}   props.saveLabel             Label for the save button.
 * @param {Function} props.renderDialog          Function to render a custom dialog.
 * @param {Array}    props.dirtyEntityRecords    Array of dirty entity records.
 * @param {boolean}  props.isDirty               Flag indicating if there are dirty entities.
 * @param {Function} props.setUnselectedEntities Function to set unselected entities.
 * @param {Array}    props.unselectedEntities    Array of unselected entities.
 *
 * @return {JSX.Element} The rendered component.
 */
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
