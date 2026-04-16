export interface WidgetType {
	name: string;
	title: string;
	description?: string;
	icon?: string | Record< string, unknown >;
	category?: string;
	keywords?: string[];
	render_module: string;
	attributes?: Array< {
		id: string;
		type: string;
		label: string;
		elements?: Array< { value: string; label: string } >;
	} >;
	example?: Record< string, unknown >;
}

export interface WidgetTypesState {
	widgetTypes: Record< string, WidgetType >;
}
