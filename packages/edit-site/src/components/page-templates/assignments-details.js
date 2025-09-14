/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';
import {
	privateApis as corePrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE, LAYOUT_GRID } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { authorField, descriptionField, previewField } from './fields';
import Page from '../page';

const { templateTitleField } = unlock( editorPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );
const { useLocation } = unlock( routerPrivateApis );

function PageTemplatesHierarchyModal( { activeTemplatesOption, slug } ) {
	const { getEntityRecord } = useSelect( coreStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );

	let postType;

	if ( slug === 'page' ) {
		postType = 'page';
	} else if ( slug === 'single' ) {
		postType = 'post';
	} else if ( slug === 'attachment' ) {
		postType = 'attachment';
	} else if ( /^single-/.test( slug ) ) {
		postType = slug.replace( /^single-/, '' );
	}

	const { records: userRecords, isResolving: isLoadingUserRecords } =
		useEntityRecordsWithPermissions( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
			slug,
		} );
	const { records: staticRecords, isResolving: isLoadingStaticData } =
		useEntityRecordsWithPermissions( 'postType', '_wp_static_template', {
			per_page: -1,
		} );
	let { records: staticRecordsByPostType } = useEntityRecordsWithPermissions(
		'postType',
		'_wp_static_template',
		{
			per_page: -1,
			post_type: postType,
		}
	);

	if ( ! postType ) {
		staticRecordsByPostType = [];
	}

	const staticRecordsWithSlug = useMemo( () => {
		return staticRecords?.filter( ( t ) => t.slug === slug );
	}, [ staticRecords, slug ] );

	// Get initial local state value for this slot
	const initialLocalValue = useMemo( () => {
		if ( ! slug || ! activeTemplatesOption ) {
			return undefined;
		}
		return activeTemplatesOption[ slug ];
	}, [ slug, activeTemplatesOption ] );

	// Local state for managing changes before save
	const [ localActiveValue, setLocalActiveValue ] =
		useState( initialLocalValue );
	const [ isSaving, setIsSaving ] = useState( false );

	// Determine which tab should be selected based on current assignment
	const currentActiveTemplate = useMemo( () => {
		if ( ! slug ) {
			return null;
		}

		const activeValue = localActiveValue;

		// If explicitly disabled
		if ( activeValue === false ) {
			return null;
		}

		// If specific template ID is set
		if (
			typeof activeValue === 'number' ||
			typeof activeValue === 'string'
		) {
			// Check if it's a user template
			const userTemplate = userRecords.find(
				( t ) => t.id === activeValue
			);
			if ( userTemplate ) {
				return { template: userTemplate, type: 'user' };
			}
			// Otherwise it's a static template
			const staticTemplate = staticRecords.find(
				( t ) => t.id === activeValue
			);
			if ( staticTemplate ) {
				return { template: staticTemplate, type: 'static' };
			}
		}

		// Default case: use theme/plugin template if available
		const defaultStaticTemplate = staticRecords.find(
			( t ) => t.slug === slug
		);
		if ( defaultStaticTemplate ) {
			return { template: defaultStaticTemplate, type: 'static' };
		}

		return null;
	}, [ slug, localActiveValue, userRecords, staticRecords ] );

	const isSlotEnabled = localActiveValue !== false;

	const handleSave = useCallback( async () => {
		if ( ! slug ) {
			return;
		}

		setIsSaving( true );

		try {
			const currentActiveTemplates = {
				...( ( await getEntityRecord( 'root', 'site' ) )
					?.active_templates ?? {} ),
			};

			if ( localActiveValue === undefined ) {
				// Remove assignment to use default
				delete currentActiveTemplates[ slug ];
			} else {
				// Set the specific value (false for disabled, ID for specific template)
				currentActiveTemplates[ slug ] = localActiveValue;
			}

			// Prevent collapse workaround
			currentActiveTemplates.__preventCollapse = 0;

			await editEntityRecord( 'root', 'site', undefined, {
				active_templates: currentActiveTemplates,
			} );
			await saveEditedEntityRecord( 'root', 'site' );
		} finally {
			setIsSaving( false );
		}
	}, [
		slug,
		localActiveValue,
		getEntityRecord,
		editEntityRecord,
		saveEditedEntityRecord,
	] );

	if ( ! slug ) {
		return null;
	}

	return (
		<Page
			title={ slug }
			actions={
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ handleSave }
					isBusy={ isSaving }
					disabled={ isSaving }
					accessibleWhenDisabled
				>
					{ __( 'Save' ) }
				</Button>
			}
		>
			<div style={ { overflow: 'auto' } }>
				<div style={ { padding: '16px 48px' } }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Status' ) }
						help={ __(
							'If the assignment is disabled, the system will automatically use a fallback template according to the hierarchy.'
						) }
						value={ isSlotEnabled }
						onChange={ ( enabled ) => {
							if ( enabled ) {
								// Re-enable: set to undefined to use default
								setLocalActiveValue( undefined );
							} else {
								// Disable: set to false
								setLocalActiveValue( false );
							}
						} }
						disabled={ slug === 'index' }
					>
						<ToggleGroupControlOption
							label={ __( 'Enabled' ) }
							value
						/>
						<ToggleGroupControlOption
							label={ __( 'Disabled' ) }
							value={ false }
						/>
					</ToggleGroupControl>
				</div>
				<div
					inert={ isSlotEnabled }
					style={
						isSlotEnabled
							? {}
							: { opacity: 0.5, filter: 'blur(2px)' }
					}
				>
					<StaticTemplatesDataView
						records={ [
							...staticRecordsWithSlug,
							...staticRecordsByPostType,
							...userRecords,
						] }
						isLoading={
							isLoadingStaticData || isLoadingUserRecords
						}
						slug={ slug }
						selectedTemplate={ currentActiveTemplate?.template }
						onSelectTemplate={ ( template ) => {
							setLocalActiveValue(
								template ? template.id : undefined
							);
						} }
					/>
					<Button __next40pxDefaultSize variant="secondary">
						{ __( 'Add Template' ) }
					</Button>
				</div>
			</div>
		</Page>
	);
}

export function AssignmentsDetails() {
	const site = useSelect(
		( select ) => select( coreStore ).getEntityRecord( 'root', 'site' ),
		[]
	);
	const { query } = useLocation();
	const { slug } = query;

	if ( ! site ) {
		return null;
	}

	return (
		<PageTemplatesHierarchyModal
			activeTemplatesOption={ site.active_templates }
			slug={ slug }
			// Remount local state when slug changes.
			key={ slug }
		/>
	);
}

function StaticTemplatesDataView( {
	records,
	isLoading,
	selectedTemplate,
	onSelectTemplate,
} ) {
	const [ view, setView ] = useState( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 20,
		sort: {
			field: 'title',
			direction: 'asc',
		},
		titleField: 'title',
		mediaField: 'preview',
		fields: [ 'author' ],
		filters: [],
		layout: {
			mediaField: 'preview',
			primaryField: 'title',
		},
	} );

	const filteredRecords = records || [];

	const selection = useMemo( () => {
		return selectedTemplate ? [ selectedTemplate.id ] : [];
	}, [ selectedTemplate ] );

	const onChangeSelection = useCallback(
		( items ) => {
			const template =
				items.length > 0
					? filteredRecords.find( ( r ) => r.id === items[ 0 ] )
					: null;
			onSelectTemplate( template );
		},
		[ filteredRecords, onSelectTemplate ]
	);

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( filteredRecords, view, [
			previewField,
			templateTitleField,
			descriptionField,
			authorField,
		] );
	}, [ filteredRecords, view ] );

	return (
		<DataViews
			paginationInfo={ paginationInfo }
			fields={ [
				previewField,
				templateTitleField,
				descriptionField,
				authorField,
			] }
			actions={ [
				{
					id: 'dummy-bulk-action',
					label: __( 'Dummy Bulk Action' ),
					supportsBulk: true,
					callback: () => {
						// console.log( 'Dummy Bulk Action', items );
					},
				},
			] }
			data={ data }
			isLoading={ isLoading }
			view={ view }
			onChangeView={ setView }
			onChangeSelection={ onChangeSelection }
			selection={ selection }
			defaultLayouts={ {
				[ LAYOUT_GRID ]: {},
			} }
			getItemId={ ( item ) => item.id }
			isItemClickable={ () => true }
		/>
	);
}
