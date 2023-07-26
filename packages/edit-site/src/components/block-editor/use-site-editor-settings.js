/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import inserterMediaCategories from './inserter-media-categories';
import { store as preferencesStore } from '@wordpress/preferences';

function useArchiveLabel( templateSlug ) {
	const taxonomyMatches = templateSlug?.match(
		/^(category|tag|taxonomy-([^-]+))$|^(((category|tag)|taxonomy-([^-]+))-(.+))$/
	);
	let taxonomy;
	let term;
	let isAuthor = false;
	let authorSlug;
	if ( taxonomyMatches ) {
		// If is for a all taxonomies of a type
		if ( taxonomyMatches[ 1 ] ) {
			taxonomy = taxonomyMatches[ 2 ]
				? taxonomyMatches[ 2 ]
				: taxonomyMatches[ 1 ];
		}
		// If is for a all taxonomies of a type
		else if ( taxonomyMatches[ 3 ] ) {
			taxonomy = taxonomyMatches[ 6 ]
				? taxonomyMatches[ 6 ]
				: taxonomyMatches[ 4 ];
			term = taxonomyMatches[ 7 ];
		}
		taxonomy = taxonomy === 'tag' ? 'post_tag' : taxonomy;

		//getTaxonomy( 'category' );
		//wp.data.select('core').getEntityRecords( 'taxonomy', 'category', {slug: 'newcat'} );
	} else {
		const authorMatches = templateSlug?.match( /^(author)$|^author-(.+)$/ );
		if ( authorMatches ) {
			isAuthor = true;
			if ( authorMatches[ 2 ] ) {
				authorSlug = authorMatches[ 2 ];
			}
		}
	}
	return useSelect(
		( select ) => {
			const { getEntityRecords, getTaxonomy, getAuthors } =
				select( coreStore );
			let archiveTypeLabel;
			let archiveNameLabel;
			if ( taxonomy ) {
				archiveTypeLabel =
					getTaxonomy( taxonomy )?.labels?.singular_name;
			}
			if ( term ) {
				const records = getEntityRecords( 'taxonomy', taxonomy, {
					slug: term,
					per_page: 1,
				} );
				if ( records && records[ 0 ] ) {
					archiveNameLabel = records[ 0 ].name;
				}
			}
			if ( isAuthor ) {
				archiveTypeLabel = 'Author';
				if ( authorSlug ) {
					const authorRecords = getAuthors( { slug: authorSlug } );
					if ( authorRecords && authorRecords[ 0 ] ) {
						archiveNameLabel = authorRecords[ 0 ].name;
					}
				}
			}
			return {
				archiveTypeLabel,
				archiveNameLabel,
			};
		},
		[ authorSlug, isAuthor, taxonomy, term ]
	);
}

export default function useSiteEditorSettings() {
	const { setIsInserterOpened } = useDispatch( editSiteStore );
	const { storedSettings, canvasMode, templateType } = useSelect(
		( select ) => {
			const { getSettings, getCanvasMode, getEditedPostType } = unlock(
				select( editSiteStore )
			);
			return {
				storedSettings: getSettings( setIsInserterOpened ),
				canvasMode: getCanvasMode(),
				templateType: getEditedPostType(),
			};
		},
		[ setIsInserterOpened ]
	);

	const { linkControlAdvancedSettingsPreference } = useSelect( ( select ) => {
		const prefsStore = select( preferencesStore );

		return {
			linkControlAdvancedSettingsPreference:
				prefsStore.get(
					'core/edit-site',
					'linkControlSettingsDrawer'
				) ?? false,
		};
	}, [] );

	const { set: setPreference } = useDispatch( preferencesStore );

	const setLinkControlAdvancedSettingsPreference = useCallback(
		( val ) =>
			setPreference( 'core/edit-site', 'linkControlSettingsDrawer', val ),
		[ setPreference ]
	);

	const settingsBlockPatterns =
		storedSettings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		storedSettings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		storedSettings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		storedSettings.__experimentalBlockPatternCategories; // WP 5.9

	const { restBlockPatterns, restBlockPatternCategories, templateSlug } =
		useSelect( ( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getEditedEntityRecord } = select( coreStore );
			const usedPostType = getEditedPostType();
			const usedPostId = getEditedPostId();
			const _record = getEditedEntityRecord(
				'postType',
				usedPostType,
				usedPostId
			);
			return {
				restBlockPatterns: select( coreStore ).getBlockPatterns(),
				restBlockPatternCategories:
					select( coreStore ).getBlockPatternCategories(),
				templateSlug: _record.slug,
			};
		}, [] );
	const archiveLabels = useArchiveLabel( templateSlug );

	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			]
				.filter(
					( x, index, arr ) =>
						index === arr.findIndex( ( y ) => x.name === y.name )
				)
				.filter( ( { postTypes } ) => {
					return (
						! postTypes ||
						( Array.isArray( postTypes ) &&
							postTypes.includes( templateType ) )
					);
				} ),
		[ settingsBlockPatterns, restBlockPatterns, templateType ]
	);

	const blockPatternCategories = useMemo(
		() =>
			[
				...( settingsBlockPatternCategories || [] ),
				...( restBlockPatternCategories || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ settingsBlockPatternCategories, restBlockPatternCategories ]
	);
	return useMemo( () => {
		const {
			__experimentalAdditionalBlockPatterns,
			__experimentalAdditionalBlockPatternCategories,
			focusMode,
			...restStoredSettings
		} = storedSettings;

		return {
			...restStoredSettings,
			inserterMediaCategories,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
			focusMode: canvasMode === 'view' && focusMode ? false : focusMode,
			__experimentalArchiveTitleTypeLabel: archiveLabels.archiveTypeLabel,
			__experimentalArchiveTitleNameLabel: archiveLabels.archiveNameLabel,
			linkControlAdvancedSettingsPreference,
			setLinkControlAdvancedSettingsPreference,
		};
	}, [
		storedSettings,
		blockPatterns,
		blockPatternCategories,
		canvasMode,
		archiveLabels.archiveTypeLabel,
		archiveLabels.archiveNameLabel,
		linkControlAdvancedSettingsPreference,
		setLinkControlAdvancedSettingsPreference,
	] );
}
