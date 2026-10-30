import { playlistTrack as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	__experimentalLabel( attributes, { context } ) {
		const { title } = attributes;
		const customName = attributes?.metadata?.name;

		// In the list view, name the row after the track so that a tracklist
		// reads as one, rather than as a column of "Playlist track" rows.
		if ( context === 'list-view' && ( customName || title ) ) {
			return customName || title;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}
	},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
