import { FormTokenField } from '@wordpress/components';
import { Spinner } from '@wordpress/ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useMediaFolders, { MEDIA_FOLDERS_FIELD } from './use-media-folders';
import type { MediaItemWithFolders } from './types';

/*
 * The folders a media item is filed under: a multi-select over the existing
 * folders, which writes term ids.
 *
 * A token field matches the flat folder list of the experiment's inserter UI,
 * and the taxonomy is registered hierarchical, so this becomes a tree control
 * once there is a nesting UI. New folders are created from the inserter, so
 * typing a name that is not a folder yet does nothing here.
 */
export default function MediaFoldersEdit( {
	data,
	onChange,
	hideLabelFromVision,
}: {
	data: MediaItemWithFolders;
	onChange: ( value: Partial< MediaItemWithFolders > ) => void;
	hideLabelFromVision?: boolean;
} ) {
	const { folders, isResolving } = useMediaFolders();
	const selectedIds = useMemo(
		() => data?.[ MEDIA_FOLDERS_FIELD ] ?? [],
		[ data ]
	);

	const { names, idsByName, unknownIds } = useMemo( () => {
		const byId = new Map( folders.map( ( f ) => [ f.id, f.name ] ) );
		return {
			names: selectedIds
				.map( ( id ) => byId.get( id ) )
				.filter( ( name ): name is string => !! name ),
			idsByName: new Map(
				folders.map( ( f ) => [ f.name.toLowerCase(), f.id ] )
			),
			// A selected id with no folder: one deleted elsewhere, or one the
			// user cannot read. Carried through unchanged so editing the rest
			// of the list doesn't drop it.
			unknownIds: selectedIds.filter( ( id ) => ! byId.has( id ) ),
		};
	}, [ folders, selectedIds ] );

	const onChangeTokens = useCallback(
		( tokens: ( string | { value: string } )[] ) => {
			const ids = tokens
				.map( ( token ) =>
					typeof token === 'string' ? token : token.value
				)
				.map( ( name ) => idsByName.get( name.toLowerCase() ) )
				.filter( ( id ): id is number => id !== undefined );

			onChange( {
				[ MEDIA_FOLDERS_FIELD ]: [
					...new Set( [ ...ids, ...unknownIds ] ),
				],
			} );
		},
		[ idsByName, onChange, unknownIds ]
	);

	// The control maps ids to names, so it can't show the current folders
	// until they resolve, and a change made before then would drop them.
	if ( isResolving ) {
		return <Spinner />;
	}

	return (
		<FormTokenField
			// The control has no way to hide its own label, so the label is
			// left out when the layout already shows one, as the generic
			// array control does.
			label={ hideLabelFromVision ? undefined : __( 'Folders' ) }
			value={ names }
			suggestions={ folders.map( ( { name } ) => name ) }
			onChange={ onChangeTokens }
			placeholder={ __( 'Select folders' ) }
			// Folders are created from the inserter's Media tab, so only
			// existing ones can be picked here.
			__experimentalValidateInput={ ( token: string ) =>
				idsByName.has( token.toLowerCase() )
			}
			__experimentalExpandOnFocus
			help=""
		/>
	);
}
