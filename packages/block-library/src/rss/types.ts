export interface RSSAttributes extends Record< string, unknown > {
	columns: number;
	blockLayout: string;
	feedURL: string;
	itemsToShow: number;
	displayExcerpt: boolean;
	displayAuthor: boolean;
	displayDate: boolean;
	excerptLength: number;
	openInNewTab: boolean;
	rel?: string;
}
