/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	store as coreStore,
	privateApis as corePrivateApis,
	type WpTemplate,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import type { Template } from './types';

const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

/**
 * Hook to fetch and return templates based on view type.
 *
 * @param {string} activeView - The active view type ('active', 'user', or author name).
 * @return {Object} Object containing records, loading state, and raw data for tabs.
 */
export function useTemplates( activeView: string = 'active' ) {
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
		}, [] );

	// Fetch user-created templates
	const { records: userRecords, isResolving: isLoadingUserRecords } =
		useEntityRecordsWithPermissions( 'postType', 'wp_template', {
			per_page: -1,
			combinedTemplates: false,
		} );

	// Fetch registered templates
	const { records: staticRecords, isResolving: isLoadingStaticData } =
		useEntityRecordsWithPermissions( 'root', 'registeredTemplate', {
			per_page: -1,
		} );

	// Compute active templates
	const activeTemplates = useMemo( () => {
		const _active = [ ...staticRecords ];
		if ( activeTemplatesOption ) {
			for ( const activeSlug in activeTemplatesOption ) {
				const activeId = activeTemplatesOption[ activeSlug ];
				// Replace the template in the array.
				const template = userRecords.find(
					( userRecord: WpTemplate ) =>
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
		return _active;
	}, [ userRecords, staticRecords, activeTemplatesOption, activeTheme ] );

	// Compute records with active status and custom status
	const records: Template[] = useMemo( () => {
		function isCustom( record: any ) {
			// For registered templates, the is_custom field is defined.
			return (
				record.is_custom ??
				// For user templates it's custom if the is_wp_suggestion meta
				// field is not set and the slug is not found in the default
				// template types.
				( ! record.meta?.is_wp_suggestion &&
					! defaultTemplateTypes.some(
						( type: any ) => type.slug === record.slug
					) )
			);
		}

		let _records;
		if ( activeView === 'active' ) {
			// Active view: show active templates, exclude custom
			_records = activeTemplates.filter(
				( record ) => ! isCustom( record )
			);
		} else if ( activeView === 'user' ) {
			// User view: show all user templates
			_records = userRecords;
		} else {
			// Author view: show registered templates
			_records = staticRecords;
		}

		return _records.map( ( record: WpTemplate ) => ( {
			...record,
			_isActive: activeTemplates.some(
				( template ) => template.id === record.id
			),
			_isCustom: isCustom( record ),
		} ) );
	}, [
		activeTemplates,
		defaultTemplateTypes,
		userRecords,
		staticRecords,
		activeView,
	] );

	return {
		records,
		isLoading: isLoadingUserRecords || isLoadingStaticData,
		staticRecords,
		userRecords,
		activeTemplates,
	};
}
