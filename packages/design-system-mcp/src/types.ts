export interface ManifestComponent {
	id: string;
	name: string;
	path: string;
	description?: string;
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
