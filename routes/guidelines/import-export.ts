/**
 * WordPress dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	scopeSlug,
	blockSlug,
	saveGuidelineRow,
	deleteGuidelineRow,
} from './data';
import type {
	Scope,
	GuidelineRow,
	ContentBlock,
	GuidelineQuery,
	GuidelineImportData,
} from './types';

// Matches the block name validation WP_Block_Type_Registry::register() uses.
const BLOCK_NAME_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

function isValidImport( data: unknown ): data is GuidelineImportData {
	return (
		!! data &&
		typeof data === 'object' &&
		'guideline_categories' in data &&
		typeof ( data as Record< string, unknown > ).guideline_categories ===
			'object' &&
		( data as Record< string, unknown > ).guideline_categories !== null
	);
}

function readGuidelines( value: unknown ): string {
	if ( value && typeof value === 'object' && 'guidelines' in value ) {
		const text = ( value as { guidelines?: unknown } ).guidelines;
		return typeof text === 'string' ? text : '';
	}
	return '';
}

/**
 * Exports the current guidelines to a JSON file. Same shape and filename as the
 * singleton era so existing tooling keeps working.
 *
 * @param scopes        Registry scopes.
 * @param bySlug        Resolved rows indexed by slug.
 * @param contentBlocks Content-role blocks from the client registry.
 */
export function exportGuidelines(
	scopes: Scope[],
	bySlug: Record< string, GuidelineRow >,
	contentBlocks: ContentBlock[]
): void {
	const categories: Record< string, unknown > = {};

	for ( const scope of scopes ) {
		categories[ scope.slug ] = {
			guidelines: bySlug[ scopeSlug( scope.slug ) ]?.content ?? '',
		};
	}

	const blocks: Record< string, { guidelines: string } > = {};
	for ( const block of contentBlocks ) {
		const content = bySlug[ blockSlug( block.name ) ]?.content;
		if ( content ) {
			blocks[ block.name ] = { guidelines: content };
		}
	}
	categories.blocks = blocks;

	const now = new Date();
	const exportDate = [
		now.getFullYear(),
		String( now.getMonth() + 1 ).padStart( 2, '0' ),
		String( now.getDate() ).padStart( 2, '0' ),
	].join( '-' );

	downloadBlob(
		`guidelines-${ exportDate }.json`,
		JSON.stringify( { guideline_categories: categories }, null, 2 ),
		'application/json'
	);

	dispatch( noticesStore ).createSuccessNotice(
		__( 'Guidelines exported.' ),
		{
			type: 'snackbar',
		}
	);
}

/**
 * Imports guidelines from a JSON file, fully replacing the current ones.
 *
 * @param file          The JSON file.
 * @param scopes        Registry scopes.
 * @param bySlug        Resolved rows indexed by slug.
 * @param contentBlocks Content-role blocks from the client registry.
 * @param query         Collection query to invalidate after creates.
 */
export async function importGuidelines(
	file: File,
	scopes: Scope[],
	bySlug: Record< string, GuidelineRow >,
	contentBlocks: ContentBlock[],
	query: GuidelineQuery
): Promise< void > {
	const parsed: unknown = JSON.parse( await file.text() );

	if ( ! isValidImport( parsed ) ) {
		throw new Error(
			__(
				'Check that your file contains valid JSON markup and try again.'
			)
		);
	}

	const categories = parsed.guideline_categories;

	// Registry scopes: set or clear each one.
	for ( const scope of scopes ) {
		const slug = scopeSlug( scope.slug );
		const value = readGuidelines( categories[ scope.slug ] );
		const existingId = bySlug[ slug ]?.id;

		if ( value ) {
			await saveGuidelineRow(
				slug,
				scope.title,
				value,
				existingId,
				query
			);
		} else if ( existingId ) {
			await deleteGuidelineRow( existingId );
		}
	}

	const importedBlocks =
		categories.blocks && typeof categories.blocks === 'object'
			? ( categories.blocks as Record< string, unknown > )
			: {};

	// Save every imported block guideline (validated block names only).
	for ( const [ name, value ] of Object.entries( importedBlocks ) ) {
		if ( ! BLOCK_NAME_RE.test( name ) ) {
			continue;
		}
		const slug = blockSlug( name );
		const text = readGuidelines( value );
		const existingId = bySlug[ slug ]?.id;

		if ( text ) {
			await saveGuidelineRow( slug, name, text, existingId, query );
		} else if ( existingId ) {
			await deleteGuidelineRow( existingId );
		}
	}

	// Clear existing block rows the import omits.
	for ( const block of contentBlocks ) {
		const existingId = bySlug[ blockSlug( block.name ) ]?.id;
		if ( existingId && ! ( block.name in importedBlocks ) ) {
			await deleteGuidelineRow( existingId );
		}
	}

	dispatch( noticesStore ).createSuccessNotice(
		__( 'Guidelines imported.' ),
		{
			type: 'snackbar',
		}
	);
}
