/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
/**
 * Internal dependencies
 */
import { unlock } from '../../../private-apis';

const SITE_EDITOR_AUTHORS_QUERY = {
	per_page: -1,
	_fields: 'id,name,avatar_urls',
	context: 'view',
	capabilities: [ 'edit_theme_options' ],
};

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
export default function useGlobalStylesRevisions() {
	const { user: userConfig } = useContext( GlobalStylesContext );
	const { authors, currentUser, isDirty, revisions, isLoading } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				getCurrentUser,
				getUsers,
				getCurrentThemeGlobalStylesRevisions,
				isResolving,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			const _currentUser = getCurrentUser();
			const _isDirty = dirtyEntityRecords.length > 0;
			const globalStylesRevisions =
				getCurrentThemeGlobalStylesRevisions() || [];
			const _authors = getUsers( SITE_EDITOR_AUTHORS_QUERY );

			return {
				authors: _authors,
				currentUser: _currentUser,
				isDirty: _isDirty,
				revisions: globalStylesRevisions,
				isLoading:
					! globalStylesRevisions.length ||
					isResolving( 'getUsers', [ SITE_EDITOR_AUTHORS_QUERY ] ),
			};
		},
		[]
	);
	return useMemo( () => {
		let _modifiedRevisions = [];
		if ( isLoading || ! revisions.length ) {
			return {
				revisions: _modifiedRevisions,
				hasUnsavedChanges: isDirty,
				isLoading,
			};
		}
		/*
		 * Adds a flag to the first revision, which is the latest.
		 * Also adds author information to the revision.
		 * Then, if there are unsaved changes in the editor, create a
		 * new "revision" item that represents the unsaved changes.
		 */
		_modifiedRevisions = revisions.map( ( revision ) => {
			return {
				...revision,
				author: authors.find(
					( author ) => author.id === revision.author
				),
			};
		} );

		if ( _modifiedRevisions[ 0 ]?.id !== 'unsaved' ) {
			_modifiedRevisions[ 0 ].isLatest = true;
		}

		if ( isDirty && ! isEmpty( userConfig ) && currentUser ) {
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
			isLoading,
		};
	}, [ revisions.length, isDirty, isLoading ] );
}
