/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import {
	ExternalLink,
	Modal,
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { Page } from '@wordpress/admin-ui';
import { check, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import type { View, Field, Action } from '@wordpress/dataviews';
import './style.scss';

/**
 * Layout constant.
 */
const LAYOUT_TABLE = 'table';

/**
 * Experiment type definition.
 */
interface Experiment {
	id: string;
	name: string;
	description: string;
	category: 'blocks' | 'editor' | 'advanced';
	enabled: boolean;
	warning?: string;
	learnMore?: string;
	requires?: string;
}

/**
 * Get experiment definitions from window.
 * These are registered via the init module.
 */
function getExperimentDefinitions(): Experiment[] {
	return ( window as any ).gutenbergExperimentDefinitions || [];
}

/**
 * Confirmation dialog state.
 */
interface ConfirmationDialog {
	type: 'enable-with-dependency' | 'disable-with-dependents';
	experimentIds: string[];
	additionalIds: string[];
}

/**
 * Main experiments page stage component.
 */
function Stage() {
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ confirmDialog, setConfirmDialog ] =
		useState< ConfirmationDialog | null >( null );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const experimentDefs = getExperimentDefinitions();

	// DataViews view state.
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 50,
		filters: [],
		fields: [ 'status' ],
		titleField: 'name',
		descriptionField: 'description',
		layout: {
			styles: {
				status: {
					width: '1%',
					minWidth: '80px',
					maxWidth: '100px',
				},
			},
		},
	} );

	// Use core-data to read the gutenberg-experiments setting.
	const { record: siteSettings, hasResolved } = useEntityRecord(
		'root',
		'site'
	);

	// Get current experiment values from settings.
	const gutenbergExperiments = useMemo( () => {
		return ( siteSettings as any )?.[ 'gutenberg-experiments' ] || {};
	}, [ siteSettings ] );

	// Merge experiment definitions with current values.
	const experiments: Experiment[] = useMemo( () => {
		if ( ! experimentDefs || ! hasResolved ) {
			return [];
		}
		return experimentDefs.map( ( exp ) => ( {
			...exp,
			enabled: Boolean( gutenbergExperiments[ exp.id ] ),
		} ) );
	}, [ experimentDefs, gutenbergExperiments, hasResolved ] );

	// Helper to get experiment by ID.
	const getExperimentById = useCallback(
		( id: string ) => experiments.find( ( exp ) => exp.id === id ),
		[ experiments ]
	);

	// Helper to get experiments that depend on a given experiment.
	const getDependentExperiments = useCallback(
		( experimentId: string ) =>
			experiments.filter( ( exp ) => exp.requires === experimentId ),
		[ experiments ]
	);

	// Check if enabling/disabling would affect other experiments.
	const getAffectedExperiments = useCallback(
		( experimentIds: string[], enabled: boolean ) => {
			const additionalIds: string[] = [];

			for ( const experimentId of experimentIds ) {
				if ( enabled ) {
					// Check for required experiments that aren't enabled.
					const exp = getExperimentById( experimentId );
					if (
						exp?.requires &&
						! gutenbergExperiments[ exp.requires ]
					) {
						additionalIds.push( exp.requires );
					}
				} else {
					// Check for dependent experiments that are enabled.
					const dependents = getDependentExperiments( experimentId );
					for ( const dep of dependents ) {
						if ( gutenbergExperiments[ dep.id ] ) {
							additionalIds.push( dep.id );
						}
					}
				}
			}

			return [ ...new Set( additionalIds ) ]; // Remove duplicates
		},
		[ gutenbergExperiments, getExperimentById, getDependentExperiments ]
	);

	// Perform the actual update (called directly or after confirmation).
	const performUpdate = useCallback(
		async ( experimentIds: string[], enabled: boolean ) => {
			const newExperiments = { ...gutenbergExperiments };
			const additionalIds = getAffectedExperiments(
				experimentIds,
				enabled
			);

			// Apply changes to primary experiments.
			for ( const experimentId of experimentIds ) {
				if ( enabled ) {
					newExperiments[ experimentId ] = true;
				} else {
					delete newExperiments[ experimentId ];
				}
			}

			// Apply changes to affected experiments.
			for ( const additionalId of additionalIds ) {
				if ( enabled ) {
					newExperiments[ additionalId ] = true;
				} else {
					delete newExperiments[ additionalId ];
				}
			}

			// Save directly without going through edit() to avoid dirty tracking.
			await saveEntityRecord( 'root', 'site', {
				'gutenberg-experiments': newExperiments,
			} );

			// Show toast notification.
			const totalCount = experimentIds.length + additionalIds.length;
			const message = enabled
				? totalCount === 1
					? __( 'Experiment enabled.' )
					: __( 'Experiments enabled.' )
				: totalCount === 1
					? __( 'Experiment disabled.' )
					: __( 'Experiments disabled.' );

			createSuccessNotice( message, { type: 'snackbar' } );

			// Clear selection and dialog.
			setSelection( [] );
			setConfirmDialog( null );
		},
		[
			gutenbergExperiments,
			saveEntityRecord,
			createSuccessNotice,
			getAffectedExperiments,
		]
	);

	// Request to update experiments (may show confirmation dialog).
	const updateExperiments = useCallback(
		async ( experimentIds: string[], enabled: boolean ) => {
			const additionalIds = getAffectedExperiments(
				experimentIds,
				enabled
			);

			// If there are affected experiments, show confirmation dialog.
			if ( additionalIds.length > 0 ) {
				setConfirmDialog( {
					type: enabled
						? 'enable-with-dependency'
						: 'disable-with-dependents',
					experimentIds,
					additionalIds,
				} );
				return;
			}

			// No affected experiments, proceed directly.
			await performUpdate( experimentIds, enabled );
		},
		[ getAffectedExperiments, performUpdate ]
	);

	// Define actions - primary actions show on hover, bulk actions in footer.
	const actions: Action< Experiment >[] = useMemo(
		() => [
			{
				id: 'enable',
				label: __( 'Enable' ),
				icon: check,
				isPrimary: true,
				supportsBulk: true,
				isEligible: ( item ) => ! item.enabled,
				callback: async ( items ) => {
					await updateExperiments(
						items.map( ( item ) => item.id ),
						true
					);
				},
			},
			{
				id: 'disable',
				label: __( 'Disable' ),
				icon: closeSmall,
				isPrimary: true,
				supportsBulk: true,
				isEligible: ( item ) => item.enabled,
				callback: async ( items ) => {
					await updateExperiments(
						items.map( ( item ) => item.id ),
						false
					);
				},
			},
		],
		[ updateExperiments ]
	);

	// Define fields for DataViews.
	const fields: Field< Experiment >[] = useMemo(
		() => [
			{
				id: 'name',
				label: __( 'Experiment' ),
				type: 'text' as const,
				enableGlobalSearch: true,
				enableHiding: false,
				enableSorting: true,
				getValue: ( { item }: { item: Experiment } ) => item.name,
			},
			{
				id: 'description',
				label: __( 'Description' ),
				type: 'text' as const,
				enableGlobalSearch: true,
				enableHiding: true,
				getValue: ( { item }: { item: Experiment } ) => {
					let text = item.description;
					if ( item.learnMore ) {
						text += ` →`;
					}
					return text;
				},
				render: ( { item }: { item: Experiment } ) => {
					const requiredExp = item.requires
						? experiments.find( ( e ) => e.id === item.requires )
						: null;
					const isRequirementMet = requiredExp?.enabled ?? true;

					return (
						<span className="experiments-description">
							{ item.description }
							{ item.learnMore && (
								<>
									{ ' ' }
									<ExternalLink href={ item.learnMore }>
										{ __( 'Learn more' ) }
									</ExternalLink>
								</>
							) }
							{ requiredExp && ! isRequirementMet && (
								<span className="experiments-requires">
									{ sprintf(
										/* translators: %s: name of required experiment */
										__( 'Requires %s to be enabled.' ),
										requiredExp.name
									) }
								</span>
							) }
						</span>
					);
				},
			},
			{
				id: 'status',
				label: __( 'Status' ),
				type: 'text' as const,
				enableHiding: false,
				enableSorting: true,
				getValue: ( { item }: { item: Experiment } ) =>
					item.enabled ? 'enabled' : 'disabled',
				render: ( { item }: { item: Experiment } ) => (
					<span
						className={ `experiments-status-cell experiments-status ${
							item.enabled
								? 'experiments-status--enabled'
								: 'experiments-status--disabled'
						}` }
					>
						{ item.enabled ? __( 'Enabled' ) : __( 'Disabled' ) }
					</span>
				),
			},
		],
		[ experiments ]
	);

	// Filter, sort, and paginate data.
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( experiments, view, fields );
	}, [ experiments, view, fields ] );

	const isLoading = ! hasResolved;

	// Get names for confirmation dialog.
	const getExperimentNames = ( ids: string[] ) =>
		ids
			.map( ( id ) => getExperimentById( id )?.name )
			.filter( Boolean ) as string[];

	return (
		<Page
			title={ __( 'Experimental Settings' ) }
			subTitle={ __(
				"The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production."
			) }
			className="experiments-page"
		>
			<DataViews
				data={ processedData }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: {},
				} }
				actions={ actions }
				getItemId={ ( item ) => item.id }
				isLoading={ isLoading }
				search
				searchLabel={ __( 'Search experiments' ) }
				selection={ selection }
				onChangeSelection={ setSelection }
			/>

			{ confirmDialog && (
				<Modal
					title={
						confirmDialog.type === 'enable-with-dependency'
							? __( 'Enable required experiments?' )
							: __( 'Disable dependent experiments?' )
					}
					onRequestClose={ () => setConfirmDialog( null ) }
					size="small"
					className="experiments-confirm-modal"
				>
					<VStack spacing={ 4 }>
						{ confirmDialog.type === 'enable-with-dependency' ? (
							<Text>
								{ sprintf(
									/* translators: %s: list of experiment names */
									_n(
										'This experiment requires %s to be enabled. Would you like to enable it as well?',
										'This experiment requires the following experiments to be enabled: %s. Would you like to enable them as well?',
										confirmDialog.additionalIds.length
									),
									getExperimentNames(
										confirmDialog.additionalIds
									).join( ', ' )
								) }
							</Text>
						) : (
							<Text>
								{ sprintf(
									/* translators: %s: list of experiment names */
									_n(
										'The following experiment depends on this and will also be disabled: %s',
										'The following experiments depend on this and will also be disabled: %s',
										confirmDialog.additionalIds.length
									),
									getExperimentNames(
										confirmDialog.additionalIds
									).join( ', ' )
								) }
							</Text>
						) }

						<div className="experiments-confirm-modal__actions">
							<Button
								variant="tertiary"
								onClick={ () => setConfirmDialog( null ) }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ () =>
									performUpdate(
										confirmDialog.experimentIds,
										confirmDialog.type ===
											'enable-with-dependency'
									)
								}
							>
								{ confirmDialog.type === 'enable-with-dependency'
									? __( 'Enable all' )
									: __( 'Disable all' ) }
							</Button>
						</div>
					</VStack>
				</Modal>
			) }
		</Page>
	);
}

export const stage = Stage;
