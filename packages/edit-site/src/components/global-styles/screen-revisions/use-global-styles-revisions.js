/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const SITE_EDITOR_AUTHORS_QUERY = {
	per_page: -1,
	_fields: 'id,name,avatar_urls',
	context: 'view',
	capabilities: [ 'edit_theme_options' ],
};
const EMPTY_ARRAY = [];
const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
export default function useGlobalStylesRevisions() {
	const { user: userConfig } = useContext( GlobalStylesContext );
	const { authors, currentUser, isDirty, revisions } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				getCurrentUser,
				getUsers,
				getCurrentThemeGlobalStylesRevisions,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			const _currentUser = getCurrentUser();
			const _isDirty = dirtyEntityRecords.length > 0;
			const globalStylesRevisions =
				getCurrentThemeGlobalStylesRevisions() || EMPTY_ARRAY;
			const _authors =
				getUsers( SITE_EDITOR_AUTHORS_QUERY ) || EMPTY_ARRAY;

			return {
				authors: _authors,
				currentUser: _currentUser,
				isDirty: _isDirty,
				revisions: globalStylesRevisions,
			};
		},
		[]
	);
	return useMemo( () => {
		let _modifiedRevisions = [];
		if ( ! authors.length || ! revisions.length ) {
			return {
				revisions: _modifiedRevisions,
				hasUnsavedChanges: isDirty,
				isLoading: true,
			};
		}

		// Adds author details to each revision.
		_modifiedRevisions = revisions.map( ( revision ) => {
			return {
				...revision,
				author: authors.find(
					( author ) => author.id === revision.author
				),
			};
		} );

		// Flags the most current saved revision.
		if ( _modifiedRevisions[ 0 ].id !== 'unsaved' ) {
			_modifiedRevisions[ 0 ].isLatest = true;
		}

		// Adds an item for unsaved changes.
		if (
			isDirty &&
			userConfig &&
			Object.keys( userConfig ).length > 0 &&
			currentUser
		) {
			const unsavedRevision = {
				id: 'unsaved',
				styles: userConfig?.styles,
				settings: userConfig?.settings,
				author: {
					name: currentUser?.name,
					avatar_urls: currentUser?.avatar_urls,
				},
				modified: new Date(),
			};

			_modifiedRevisions.unshift( unsavedRevision );
		}

		return {
			revisions: _modifiedRevisions,
			hasUnsavedChanges: isDirty,
			isLoading: false,
		};
	}, [ isDirty, revisions, currentUser, authors, userConfig ] );
}
