export interface RawInstance {
	content?: string;
	count?: number | boolean;
	dropdown?: boolean;
	show_date?: boolean;
	number?: number;
	taxonomy?: string;
	hierarchical?: boolean;
	url?: string;
	preload?: string;
	loop?: boolean;
	attachment_id?: number;
	alt?: string;
	caption?: string;
	height?: number;
	link_classes?: string;
	link_rel?: string;
	link_target_blank?: boolean;
	link_type?: string;
	link_url?: string;
	size?: string;
	width?: number;
	ids?: number[];
	show_author?: boolean;
	show_summary?: boolean;
	items?: number;
	title?: string;
	text?: string;
	[ key: string ]: unknown;
}

export interface LegacyWidgetAttributes extends Record< string, unknown > {
	id?: string | null;
	idBase?: string | null;
	instance?: {
		raw?: RawInstance;
		hash?: string;
		[ key: string ]: unknown;
	} | null;
}
