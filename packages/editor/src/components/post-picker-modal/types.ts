/**
 * External dependencies
 */
import type { ReactElement } from 'react';

export interface PostPickerParams {
	/** The post type slug to filter (e.g., 'page', 'post') */
	postType: string;

	/** Called when a post is selected with the post ID */
	onSelect: ( postId: number ) => void;

	/** Optional: Post ID to exclude from results (current post) */
	excludePostId?: number;

	/** Optional: Custom modal title. Defaults to "Select {PostType}" */
	title?: string;
}

export interface PostPickerState extends PostPickerParams {
	/** Whether the modal is currently open */
	isOpen: boolean;
}

export interface PostPickerModalProps {
	/** Controls whether the modal is visible */
	isOpen: boolean;

	/** Called when the modal is closed (X button or escape key) */
	onClose: () => void;

	/** Called when a post is selected with the post ID */
	onSelect: ( postId: number ) => void;

	/** The post type slug to filter (e.g., 'page', 'post') */
	postType: string;

	/** Optional: Post ID to exclude from results (current post) */
	excludePostId?: number;

	/** Optional: Custom modal title. Defaults to "Select {PostType}" */
	title?: string;
}

export interface PostData {
	id: number;
	title: {
		raw?: string;
		rendered?: string;
	};
	status: 'publish' | 'draft' | 'pending' | 'private' | 'future' | 'trash';
	parent?: number;
	date?: string;
	date_gmt?: string;
	modified?: string;
	modified_gmt?: string;
	slug?: string;
	type: string;
	link?: string;
	_embedded?: {
		author?: Array< {
			id: number;
			name: string;
			[ key: string ]: unknown;
		} >;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

export type PostPickerModalComponent = (
	props: PostPickerModalProps
) => ReactElement | null;

export type OpenPostPicker = ( params: PostPickerParams ) => void;
