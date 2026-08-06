/**
 * Type declarations for rich-text.js (the inline HTML ↔ field codec). See
 * engine-types.d.ts for the lockstep discipline.
 */

import type { EngineField } from './engine-types';

export function htmlToField( html: string ): EngineField;

export function fieldToHtml( field: EngineField ): string;

export function encodeFormat(
	tag: string,
	attrs: Record< string, string >
): string;

export function decodeFormat(
	format: string
): { tag: string; attrs: Record< string, string > } | null;
