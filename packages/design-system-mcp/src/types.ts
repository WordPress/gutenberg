export interface ManifestDoc {
	id: string;
	name: string;
	title?: string;
	path?: string;
	content?: string;
	summary?: string;
	error?: { name: string; message: string };
}

export interface ManifestComponent {
	id: string;
	name: string;
	path: string;
	description?: string;
	docs?: Record< string, ManifestDoc >;
	stories?: Array< {
		name: string;
		snippet?: string;
		description?: string;
	} >;
	reactComponentMeta?: {
		description?: string;
		displayName?: string;
		exportName?: string;
		props?: Record<
			string,
			{
				required?: boolean;
				type?: { name: string; raw?: string };
				description?: string;
				defaultValue?: { value: string } | null;
			}
		>;
	};
}

export interface Component {
	name: string;
	description: string;
	packageName: string;
}

export interface ComponentProp {
	name: string;
	type: string;
	required: boolean;
	description: string;
	defaultValue: string | null;
}

export interface ComponentDetail {
	name: string;
	description: string;
	packageName: string;
	importStatement: string | null;
	props: ComponentProp[];
	stories: Array< {
		name: string;
		snippet?: string;
		description?: string;
	} >;
}

export interface GuidanceSummary {
	id: string;
	title: string;
	summary: string;
	/** Canonical names of the components the page is attached to. */
	components: string[];
}

export interface GuidanceDoc extends GuidanceSummary {
	content: string;
}
