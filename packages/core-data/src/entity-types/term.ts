/**
 * Internal dependencies
 */
import type { Context, ContextualField, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Term< C extends Context > {
			/**
			 * Unique identifier for the term.
			 */
			id: number;
			/**
			 * Number of published posts for the term.
			 */
			count: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * HTML description of the term.
			 */
			description: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * URL of the term.
			 */
			link: string;
			/**
			 * HTML title for the term.
			 */
			name: string;
			/**
			 * An alphanumeric identifier for the term unique to its type.
			 */
			slug: string;
			/**
			 * Type attribution for the term.
			 */
			taxonomy: string;
			/**
			 * The parent term ID. Only present for hierarchical taxonomies.
			 */
			parent?: number;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
		}
	}
}

export type Term< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Term< C >
>;
