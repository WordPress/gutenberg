/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockEditorSettings } = unlock( editorPrivateApis );

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
	const {
		templateSlug,
		focusMode,
		isDistractionFree,
		hasFixedToolbar,
		keepCaretInsideBlock,
		canvasMode,
		settings,
		postType,
		postId,
	} = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getEditedPostId,
			__unstableGetPreference,
			getCanvasMode,
			getSettings,
		} = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const usedPostType = getEditedPostType();
		const usedPostId = getEditedPostId();
		const _record = getEditedEntityRecord(
			'postType',
			usedPostType,
			usedPostId
		);
		return {
			templateSlug: _record.slug,
			focusMode: !! __unstableGetPreference( 'focusMode' ),
			isDistractionFree: !! __unstableGetPreference( 'distractionFree' ),
			hasFixedToolbar: !! __unstableGetPreference( 'fixedToolbar' ),
			keepCaretInsideBlock: !! __unstableGetPreference(
				'keepCaretInsideBlock'
			),
			canvasMode: getCanvasMode(),
			settings: getSettings(),
			postType: usedPostType,
			postId: usedPostId,
		};
	}, [] );
	const archiveLabels = useArchiveLabel( templateSlug );

	const defaultEditorSettings = useMemo( () => {
		return {
			...settings,

			__experimentalSetIsInserterOpened: setIsInserterOpened,
			focusMode: canvasMode === 'view' && focusMode ? false : focusMode,
			isDistractionFree,
			hasFixedToolbar,
			keepCaretInsideBlock,

			// I wonder if they should be set in the post editor too
			__experimentalArchiveTitleTypeLabel: archiveLabels.archiveTypeLabel,
			__experimentalArchiveTitleNameLabel: archiveLabels.archiveNameLabel,
		};
	}, [
		settings,
		setIsInserterOpened,
		focusMode,
		isDistractionFree,
		hasFixedToolbar,
		keepCaretInsideBlock,
		canvasMode,
		archiveLabels.archiveTypeLabel,
		archiveLabels.archiveNameLabel,
	] );

	return useBlockEditorSettings( defaultEditorSettings, postType, postId );
}
