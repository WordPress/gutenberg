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
	reactDocgen?: {
		description?: string;
		displayName?: string;
		props?: Record<
			string,
			{
				required?: boolean;
				tsType?: { name: string; raw?: string };
				description?: string;
				defaultValue?: { value: string };
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
