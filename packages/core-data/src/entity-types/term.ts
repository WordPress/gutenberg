/**
 * Internal dependencies
 */
import type { Context, ContextualField, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Term< C extends Context > {
			/**
			 * A human-readable description of the term.
			 */
			description: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The title for the term.
			 */
			name: string;
			/**
			 * An alphanumeric identifier for the term.
			 */
			slug: string;
			/**
			 * The number of objects with the term.
			 */
			count: number;
			/**
			 * The ID for the term.
			 */
			id: number;
			/**
			 * The link for the term.
			 */
			link: string;
			/**
			 * Meta fields for the term.
			 */
			meta: { [ key: string ]: unknown };
			/**
			 * The parent term ID.
			 */
			parent: number;
			/**
			 * The term taxonomy slug.
			 */
			taxonomy: string;
		}
	}
}

export type Term< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Term< C >
>;
