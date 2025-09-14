/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Page from '../page';
import AddNewTemplate from '../add-new-template';
import { LAYOUT_LIST } from '../../utils/constants';
import { activeField } from './fields';
import { useDefaultTemplateTypes } from '../add-new-template/utils';
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export function PageTemplateAssignments() {
	const { path, query } = useLocation();
	const { slug } = query;
	const [ view, setView ] = useState( {
		type: LAYOUT_LIST,
		titleField: 'title',
		descriptionField: 'description',
		fields: [ 'author', 'active' ],
	} );
	const [ selection, setSelection ] = useState( [ slug ] );
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const { records } = useEntityRecords( 'postType', '_wp_static_template', {
		per_page: -1,
	} );
	const activeTemplatesOption = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', 'site' )
				?.active_templates
	);
	const data = useMemo( () => {
		const types = [];
		const defaultTemplateSlugs = new Set(
			defaultTemplateTypes.map( ( type ) => type.slug )
		);
		if ( records ) {
			for ( const record of records ) {
				if ( record.is_custom === true ) {
					continue;
				}
				if ( defaultTemplateSlugs.has( record.slug ) ) {
					const index = defaultTemplateTypes.findIndex(
						( type ) => type.slug === record.slug
					);
					if ( index !== -1 ) {
						types.push( {
							...defaultTemplateTypes[ index ],
							source: activeTemplatesOption[ record.slug ]
								? 'custom'
								: record.source,
							_isActive:
								activeTemplatesOption[ record.slug ] ?? true,
						} );
					}
				} else {
					defaultTemplateTypes.push( {
						slug: record.slug,
						title: record.title?.rendered,
						description: record.description,
						author: record.author_text,
						source: record.source,
						_isActive: true,
					} );
				}
			}
		}
		return types;
	}, [ defaultTemplateTypes, records, activeTemplatesOption ] );
	const history = useHistory();
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			if ( view?.type === LAYOUT_LIST ) {
				history.navigate(
					addQueryArgs( path, {
						slug: items.length === 1 ? items[ 0 ] : undefined,
					} )
				);
			}
		},
		[ history, path, view?.type ]
	);
	return (
		<Page
			className="edit-site-page-templates"
			title={ __( 'Template Assignments' ) }
			actions={ <AddNewTemplate /> }
		>
			<DataViews
				paginationInfo={ {} }
				fields={ [
					{
						id: 'title',
						label: __( 'Title' ),
						type: 'text',
					},
					{
						id: 'slug',
						label: __( 'Slug' ),
						type: 'text',
					},
					{
						id: 'description',
						label: __( 'Description' ),
						type: 'text',
					},
					{
						id: 'author',
						label: __( 'Author' ),
						type: 'text',
					},
					activeField,
				] }
				data={ data }
				isLoading={ false }
				view={ view }
				onChangeView={ setView }
				onChangeSelection={ onChangeSelection }
				selection={ selection }
				defaultLayouts={ {
					[ LAYOUT_LIST ]: {},
				} }
				getItemId={ ( item ) => item.slug }
			/>
		</Page>
	);
}
