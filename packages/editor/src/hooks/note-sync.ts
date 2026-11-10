import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import type { CoreDataPrivateApis } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

const { registerBlockAttributeMergeStrategy } = unlock(
	coreDataPrivateApis
) as Pick< CoreDataPrivateApis, 'registerBlockAttributeMergeStrategy' >;

// The note IDs of a block are a set. During real-time collaboration, this
// keeps the notes of every collaborator when several of them add or remove
// notes on the same block at the same time.
//
// Registered here, like the other note hooks, so that it runs once when the
// editor loads, whether or not the notes sidebar is open.
registerBlockAttributeMergeStrategy( 'metadata.noteId', 'set' );
