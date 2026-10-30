import type { Context, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		export interface IconCollection< C extends Context > {
			/**
			 * The icon collection slug.
			 */
			slug: string;
			/**
			 * The icon collection label.
			 */
			label: string;
			/**
			 * The icon collection description.
			 */
			description: string;
		}
	}
}

export type IconCollection< C extends Context = 'view' > = OmitNevers<
	_BaseEntityRecords.IconCollection< C >
>;
