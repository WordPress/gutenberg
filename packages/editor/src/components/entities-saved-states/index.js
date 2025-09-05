/**
 * External dependencies
 */
import clsx from 'clsx';

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
 * @param {boolean}  props.renderDialog Whether to render the component with modal dialog behavior.
 * @param {string}   props.variant      Changes the layout of the component. When an `inline` value is provided, the action buttons are rendered at the end of the component instead of at the start.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function EntitiesSavedStates( {
	close,
	renderDialog,
	variant,
} ) {
	const isDirtyProps = useIsDirty();
	return (
		<EntitiesSavedStatesExtensible
			close={ close }
			renderDialog={ renderDialog }
			variant={ variant }
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
 * @param {boolean}  props.renderDialog          Whether to render the component with modal dialog behavior.
 * @param {Array}    props.dirtyEntityRecords    Array of dirty entity records.
 * @param {boolean}  props.isDirty               Flag indicating if there are dirty entities.
 * @param {Function} props.setUnselectedEntities Function to set unselected entities.
 * @param {Array}    props.unselectedEntities    Array of unselected entities.
 * @param {string}   props.variant               Changes the layout of the component. When an `inline` value is provided, the action buttons are rendered at the end of the component instead of at the start.
 *
 * @return {React.ReactNode} The rendered component.
 */
export function EntitiesSavedStatesExtensible( {
	additionalPrompt = undefined,
	close,
	onSave = identity,
	saveEnabled: saveEnabledProp = undefined,
	saveLabel = __( 'Save' ),
	renderDialog,
	dirtyEntityRecords,
	isDirty,
	setUnselectedEntities,
	unselectedEntities,
	variant = 'default',
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
	const dialogLabelId = useInstanceId(
		EntitiesSavedStatesExtensible,
		'entities-saved-states__panel-label'
	);
	const dialogDescriptionId = useInstanceId(
		EntitiesSavedStatesExtensible,
		'entities-saved-states__panel-description'
	);

	const selectItemsToSaveDescription = !! dirtyEntityRecords.length
		? __( 'Select the items you want to save.' )
		: undefined;

	const isInline = variant === 'inline';

	const actionButtons = (
		<>
			<FlexItem
				isBlock={ isInline ? false : true }
				as={ Button }
				variant={ isInline ? 'tertiary' : 'secondary' }
				size={ isInline ? undefined : 'compact' }
				onClick={ dismissPanel }
			>
				{ __( 'Cancel' ) }
			</FlexItem>
			<FlexItem
				isBlock={ isInline ? false : true }
				as={ Button }
				ref={ saveButtonRef }
				variant="primary"
				size={ isInline ? undefined : 'compact' }
				disabled={ ! saveEnabled }
				accessibleWhenDisabled
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
		</>
	);

	return (
		<div
			ref={ renderDialog ? saveDialogRef : undefined }
			{ ...( renderDialog && saveDialogProps ) }
			className={ clsx( 'entities-saved-states__panel', {
				'is-inline': isInline,
			} ) }
			role={ renderDialog ? 'dialog' : undefined }
			aria-labelledby={ renderDialog ? dialogLabelId : undefined }
			aria-describedby={ renderDialog ? dialogDescriptionId : undefined }
		>
			{ ! isInline && (
				<Flex className="entities-saved-states__panel-header" gap={ 2 }>
					{ actionButtons }
				</Flex>
			) }

			<div className="entities-saved-states__text-prompt">
				<div className="entities-saved-states__text-prompt--header-wrapper">
					<strong
						id={ renderDialog ? dialogLabelId : undefined }
						className="entities-saved-states__text-prompt--header"
					>
						{ __( 'Are you ready to save?' ) }
					</strong>
				</div>
				<div id={ renderDialog ? dialogDescriptionId : undefined }>
					{ additionalPrompt }
					<p className="entities-saved-states__text-prompt--changes-count">
						{ isDirty
							? createInterpolateElement(
									sprintf(
										/* translators: %d: number of site changes waiting to be saved. */
										_n(
											'There is <strong>%d site change</strong> waiting to be saved.',
											'There are <strong>%d site changes</strong> waiting to be saved.',
											dirtyEntityRecords.length
										),
										dirtyEntityRecords.length
									),
									{ strong: <strong /> }
							  )
							: selectItemsToSaveDescription }
					</p>
				</div>
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

			{ isInline && (
				<Flex
					direction="row"
					justify="flex-end"
					className="entities-saved-states__panel-footer"
				>
					{ actionButtons }
				</Flex>
			) }
		</div>
	);
}
