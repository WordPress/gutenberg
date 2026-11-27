export interface TemplatePartAttributes extends Record< string, unknown > {
	slug?: string;
	theme?: string;
	tagName?: string;
	area?: string;
	layout?: Record< string, unknown > & { inherit?: boolean };
}
