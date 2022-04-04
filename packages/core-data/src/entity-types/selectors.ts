/**
 * Internal dependencies
 */
import type { User, WpTemplate } from './index';

type State = any;

/**
 * Types for all the selectors in core-data.
 *
 * Occasionally the return type is any – this reflects the historical JSdoc annotations.
 * Ideally, all instances of `any` will turn into appropriate types over time.
 */
export type isRequestingEmbedPreview = ( state: State, url: string ) => boolean;
export type getAuthors = (
	state: State,
	query: Record< string, unknown >
) => User< 'edit' >[];

export type getCurrentUser = ( state: State ) => User< 'edit' >;
export type getUserQueryResults = (
	state: State,
	queryID: string
) => User< 'edit' >[];

export type getCurrentUndoOffset = ( state: State ) => number;
export type getUndoEdit = ( state: State ) => any;
export type getRedoEdit = ( state: State ) => any;
export type hasUndo = ( state: State ) => boolean;
export type hasRedo = ( state: State ) => boolean;
export type __experimentalGetCurrentGlobalStylesId = ( state: State ) => string;
export type getThemeSupports = ( state: State ) => any;
export type getEmbedPreview = ( state: State, url: string ) => any;
export type isPreviewEmbedFallback = ( state: State, url: string ) => boolean;
export type canUser = (
	state: State,
	action: string,
	resource: string,
	id?: string
) => boolean | undefined;

export type getReferenceByDistinctEdits = ( state: State ) => any;
export type __experimentalGetTemplateForLink = (
	state: State,
	link: string
) => WpTemplate< 'edit' > | null;

export type __experimentalGetCurrentThemeBaseGlobalStyles = (
	state: State,
	link: string
) => any | null;

export type __experimentalGetCurrentThemeGlobalStylesVariations = (
	state: State,
	link: string
) => any | null;
