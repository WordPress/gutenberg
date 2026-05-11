/**
 * WordPress dependencies
 */
import type { Post as CorePost, Type } from '@wordpress/core-data';

export interface ImportDropdownProps {
	onUpload: ( data: ReusableBlock ) => void;
}

export interface ImportFormProps {
	instanceId: string | number;
	onUpload: ( reusableBlock: ReusableBlock ) => void;
}

export type PostType = Type;

export type Post = CorePost & { wp_pattern_sync_status?: string };

export interface ParsedContent {
	__file: string;
	title: string;
	content: string;
	syncStatus?: string;
	[ key: string ]: unknown;
}

export interface ReusableBlockMeta {
	wp_pattern_sync_status?: string;
}

export interface ReusableBlockData {
	title: string;
	content: string;
	status: string;
	meta?: ReusableBlockMeta;
}

export interface ReusableBlock {
	id: number;
	title: {
		raw: string;
		rendered: string;
	};
	content: {
		raw: string;
		rendered: string;
	};
	status: string;
	[ key: string ]: unknown;
}
