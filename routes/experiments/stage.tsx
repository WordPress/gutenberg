/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { ExternalLink } from '@wordpress/components';
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
}

/**
 * Get experiment definitions from window.
 * These are registered via the init module.
 */
function getExperimentDefinitions(): Experiment[] {
	return ( window as any ).gutenbergExperimentDefinitions || [];
}

/**
 * Main experiments page stage component.
 */
function Stage() {
	const [ selection, setSelection ] = useState< string[] >( [] );
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

	// Bulk update experiments.
	const updateExperiments = useCallback(
		async ( experimentIds: string[], enabled: boolean ) => {
			const newExperiments = { ...gutenbergExperiments };

			for ( const experimentId of experimentIds ) {
				if ( enabled ) {
					newExperiments[ experimentId ] = true;
				} else {
					delete newExperiments[ experimentId ];
				}
			}

			// Save directly without going through edit() to avoid dirty tracking.
			await saveEntityRecord( 'root', 'site', {
				'gutenberg-experiments': newExperiments,
			} );

			// Show toast notification.
			const count = experimentIds.length;
			const message = enabled
				? count === 1
					? __( 'Experiment enabled.' )
					: __( 'Experiments enabled.' )
				: count === 1
					? __( 'Experiment disabled.' )
					: __( 'Experiments disabled.' );

			createSuccessNotice( message, { type: 'snackbar' } );

			// Clear selection after action.
			setSelection( [] );
		},
		[ gutenbergExperiments, saveEntityRecord, createSuccessNotice ]
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
				render: ( { item }: { item: Experiment } ) => (
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
					</span>
				),
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
		[]
	);

	// Filter, sort, and paginate data.
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( experiments, view, fields );
	}, [ experiments, view, fields ] );

	const isLoading = ! hasResolved;

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
		</Page>
	);
}

export const stage = Stage;
