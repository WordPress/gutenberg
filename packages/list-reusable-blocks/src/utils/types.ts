interface ImportDropdownProps {
	onUpload: ( data: ReusableBlock ) => void;
}

interface ImportFormProps {
	instanceId: string | number;
	onUpload: ( reusableBlock: ReusableBlock ) => void;
}

interface PostType {
	rest_base: string;
	[ key: string ]: unknown;
}

interface Post {
	title: {
		raw: string;
	};
	content: {
		raw: string;
	};
	wp_pattern_sync_status: string;
	[ key: string ]: unknown;
}

interface ExportedBlock {
	__file: string;
	title: string;
	content: string;
	syncStatus: string;
}

interface ParsedContent {
	__file: string;
	title: string;
	content: string;
	syncStatus?: string;
	[ key: string ]: unknown;
}

interface ReusableBlockMeta {
	wp_pattern_sync_status?: string;
}

interface ReusableBlockData {
	title: string;
	content: string;
	status: string;
	meta?: ReusableBlockMeta;
}

interface ReusableBlock {
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

export type {
	ExportedBlock,
	ImportDropdownProps,
	ImportFormProps,
	ParsedContent,
	Post,
	PostType,
	ReusableBlock,
	ReusableBlockData,
	ReusableBlockMeta,
};
