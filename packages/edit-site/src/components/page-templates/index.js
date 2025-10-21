/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback } from '@wordpress/element';
import {
	privateApis as corePrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEvent } from '@wordpress/compose';
import { useView } from '@wordpress/views';
import { Button, Modal } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import AddNewTemplate from '../add-new-template';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import {
	useEditPostAction,
	useSetActiveTemplateAction,
} from '../dataviews-actions';
import {
	authorField,
	descriptionField,
	previewField,
	activeField,
	slugField,
	useThemeField,
} from './fields';
import { defaultLayouts, getDefaultView } from './view-utils';

const { usePostActions, templateTitleField } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

export default function PageTemplates() {
	const { path, query } = useLocation();
	const { activeView = 'active', postId } = query;
	const [ selection, setSelection ] = useState( [ postId ] );
	const [ selectedRegisteredTemplate, setSelectedRegisteredTemplate ] =
		useState( false );
	const defaultView = useMemo( () => {
		return getDefaultView( activeView );
	}, [ activeView ] );
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: TEMPLATE_POST_TYPE,
		slug: activeView,
		defaultView,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( newQueryParams ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
	} );

	const { activeTemplatesOption, activeTheme, defaultTemplateTypes } =
		useSelect( ( select ) => {
			const { getEntityRecord, getCurrentTheme } = select( coreStore );
			return {
				activeTemplatesOption: getEntityRecord( 'root', 'site' )
					?.active_templates,
				activeTheme: getCurrentTheme(),
				defaultTemplateTypes:
					select( coreStore ).getCurrentTheme()
						?.default_template_types,
			};
		} );
	// Todo: this will have to be better so that we're not fetching all the
	// records all the time. Active templates query will need to move server
	// side.
	const { records: userRecords, isResolving: isLoadingUserRecords } =
		useEntityRecordsWithPermissions( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
			combinedTemplates: false,
		} );
	const { records: staticRecords, isResolving: isLoadingStaticData } =
		useEntityRecordsWithPermissions( 'postType', 'wp_registered_template', {
			per_page: -1,
		} );

	const activeTemplates = useMemo( () => {
		const _active = [ ...staticRecords ].filter(
			( record ) => ! record.is_custom
		);
		if ( activeTemplatesOption ) {
			for ( const activeSlug in activeTemplatesOption ) {
				const activeId = activeTemplatesOption[ activeSlug ];
				if ( activeId === false ) {
					// Remove the template from the array.
					const index = _active.findIndex(
						( template ) => template.slug === activeSlug
					);
					if ( index !== -1 ) {
						_active.splice( index, 1 );
					}
				} else {
					// Replace the template in the array.
					const template = userRecords.find(
						( userRecord ) =>
							userRecord.id === activeId &&
							userRecord.theme === activeTheme.stylesheet
					);
					if ( template ) {
						const index = _active.findIndex(
							( { slug } ) => slug === template.slug
						);
						if ( index !== -1 ) {
							_active[ index ] = template;
						} else {
							_active.push( template );
						}
					}
				}
			}
		}
		return _active;
	}, [ userRecords, staticRecords, activeTemplatesOption, activeTheme ] );

	let _records;
	let isLoadingData;
	if ( activeView === 'active' ) {
		_records = activeTemplates;
		isLoadingData = isLoadingUserRecords || isLoadingStaticData;
	} else if ( activeView === 'user' ) {
		_records = userRecords;
		isLoadingData = isLoadingUserRecords;
	} else {
		_records = staticRecords;
		isLoadingData = isLoadingStaticData;
	}

	const records = useMemo( () => {
		return _records.map( ( record ) => ( {
			...record,
			_isActive: activeTemplates.find(
				( template ) => template.id === record.id
			),
			_isCustom:
				record.is_custom ||
				( ! record.meta?.is_wp_suggestion &&
					! defaultTemplateTypes.find(
						( type ) => type.slug === record.slug
					) ),
		} ) );
	}, [ _records, activeTemplates, defaultTemplateTypes ] );

	const users = useSelect(
		( select ) => {
			const { getUser } = select( coreStore );
			return records.reduce( ( acc, record ) => {
				if ( record.author_text ) {
					if ( ! acc[ record.author_text ] ) {
						acc[ record.author_text ] = record.author_text;
					}
				} else if ( record.author ) {
					if ( ! acc[ record.author ] ) {
						acc[ record.author ] = getUser( record.author );
					}
				}
				return acc;
			}, {} );
		},
		[ records ]
	);

	const history = useHistory();
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			if ( view?.type === 'list' ) {
				history.navigate(
					addQueryArgs( path, {
						postId: items.length === 1 ? items[ 0 ] : undefined,
					} )
				);
			}
		},
		[ history, path, view?.type ]
	);

	const themeField = useThemeField();
	const fields = useMemo( () => {
		const _fields = [
			previewField,
			templateTitleField,
			descriptionField,
			activeField,
			slugField,
		];
		if ( activeView === 'user' ) {
			_fields.push( themeField );
		}
		const elements = [];
		for ( const author in users ) {
			elements.push( {
				value: users[ author ]?.id ?? author,
				label: users[ author ]?.name ?? author,
			} );
		}
		_fields.push( {
			...authorField,
			elements,
		} );
		return _fields;
	}, [ users, activeView, themeField ] );

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( records, view, fields );
	}, [ records, view, fields ] );

	const { createSuccessNotice } = useDispatch( noticesStore );
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const _title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post or template, e.g: "Hello world".
								__( '"%s" successfully created.' ),
								decodeEntities( _title ) || __( '(no title)' )
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											history.navigate(
												`/${ newItem.type }/${ newItem.id }?canvas=edit`
											);
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ history, createSuccessNotice ]
	);
	const postTypeActions = usePostActions( {
		postType: TEMPLATE_POST_TYPE,
		context: 'list',
		onActionPerformed,
	} );
	const editAction = useEditPostAction();
	const setActiveTemplateAction = useSetActiveTemplateAction();
	const actions = useMemo(
		() =>
			activeView === 'user'
				? [ setActiveTemplateAction, editAction, ...postTypeActions ]
				: [ setActiveTemplateAction, ...postTypeActions ],
		[ postTypeActions, setActiveTemplateAction, editAction, activeView ]
	);

	const onChangeView = useEvent( ( newView ) => {
		if ( newView.type !== view.type ) {
			// Retrigger the routing areas resolution.
			history.invalidate();
		}
		updateView( newView );
	} );

	const duplicateAction = actions.find(
		( action ) => action.id === 'duplicate-post'
	);

	return (
		<Page
			className="edit-site-page-templates"
			title={ __( 'Templates' ) }
			actions={
				<>
					{ isModified && (
						<Button
							__next40pxDefaultSize
							onClick={ () => {
								resetToDefault();
								history.invalidate();
							} }
						>
							{ __( 'Reset view' ) }
						</Button>
					) }
					<AddNewTemplate />
				</>
			}
		>
			<DataViews
				key={ activeView }
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ () => true }
				onClickItem={ ( item ) => {
					if ( item.type === 'wp_registered_template' ) {
						setSelectedRegisteredTemplate( item );
					} else {
						history.navigate(
							`/${ item.type }/${ item.id }?canvas=edit`
						);
					}
				} }
				selection={ selection }
				defaultLayouts={ defaultLayouts }
			/>
			{ selectedRegisteredTemplate && duplicateAction && (
				<Modal
					title={ __( 'Duplicate' ) }
					onRequestClose={ () => setSelectedRegisteredTemplate() }
					size="small"
				>
					<duplicateAction.RenderModal
						items={ [ selectedRegisteredTemplate ] }
						closeModal={ () => setSelectedRegisteredTemplate() }
						onActionPerformed={ ( [ item ] ) => {
							history.navigate(
								`/${ item.type }/${ item.id }?canvas=edit`
							);
						} }
					/>
				</Modal>
			) }
		</Page>
	);
}
