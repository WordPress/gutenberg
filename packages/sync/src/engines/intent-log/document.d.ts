/**
 * Type declarations for document.js (the intent-log document model). See
 * engine-types.d.ts for the lockstep discipline.
 */

import type { EngineBlock, EngineDocument } from './engine-types';

export declare const DEFAULT_FIELD: string;

export function makeBlock( spec: Record< string, unknown > ): EngineBlock;

export function createDocument(
	blocks?: Array< Record< string, unknown > >,
	props?: Record< string, unknown >
): EngineDocument;

export function ensureProps( doc: EngineDocument ): {
	props: Record< string, unknown >;
	propVersions: Record< string, number >;
};

export function cloneDocument( doc: EngineDocument ): EngineDocument;

export function ensureField(
	block: EngineBlock,
	name: string
): EngineBlock[ 'fields' ][ string ];

export function locateBlock(
	doc: EngineDocument,
	syncId: string
): {
	block: EngineBlock;
	siblings: EngineBlock[];
	index: number;
	parentId: string | null;
} | null;

export function getBlock(
	doc: EngineDocument,
	syncId: string
): EngineBlock | null;

export function subtreeContains(
	rootBlock: EngineBlock,
	syncId: string
): boolean;

export function allSyncIds( doc: EngineDocument ): string[];

export function canonicalJson( doc: EngineDocument ): string;

export function documentsEqual( a: EngineDocument, b: EngineDocument ): boolean;
