export interface Experiment {
	id: string;
	label: string;
	description: string;
	group: string;
	separateOption?: boolean;
	optionName?: string;
}

interface SchemaProperty {
	type?: string;
	title?: string;
	description?: string;
	group?: string;
	separate_option?: boolean;
	option_name?: string;
}

export interface SettingsSchema {
	schema?: {
		properties?: {
			'gutenberg-experiments'?: {
				properties?: Record< string, SchemaProperty >;
			};
		};
	};
}
