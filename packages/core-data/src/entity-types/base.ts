/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

export type TemplatePartArea = {
	area: string;
	label: string;
	icon: string;
	description: string;
};

export type TemplateType = {
	title: string;
	description: string;
	slug: string;
};

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		export interface Base< C extends Context > {
			/**
			 * Site description.
			 */
			description: string;

			/**
			 * GMT offset for the site.
			 */
			gmt_offset: string;

			/**
			 * Home URL.
			 */
			home: string;

			/**
			 * Site title
			 */
			name: string;

			/**
			 * Site icon ID.
			 */
			site_icon?: number;

			/**
			 * Site icon URL.
			 */
			site_icon_url: string;

			/**
			 * Site logo ID.
			 */
			site_logo?: number;

			/**
			 * Site timezone string.
			 */
			timezone_string: string;

			/**
			 * Site URL.
			 */
			url: string;

			/**
			 * Page for posts.
			 */
			page_for_posts: number;

			/**
			 * Page on front.
			 */
			page_on_front: number;

			/**
			 * Show on front.
			 */
			show_on_front: string;
		}
	}
}

export type Base< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Base< C >
>;
