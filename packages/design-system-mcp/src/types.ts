export interface ManifestComponent {
	id: string;
	name: string;
	/** Present on inline manifests; resolved from docgen payload for ref manifests. */
	path?: string;
	description?: string;
	stories?:
		| Array< {
				name: string;
				snippet?: string;
				description?: string;
		  } >
		| Record<
				string,
				{
					name: string;
					snippet?: string;
					description?: string;
				}
		  >
		| { $ref: string };
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
	/** Ref-manifest index pointer into `services/core/docgen`. */
	docgen?: { $ref: string };
}

/** List-view summary. Package is intentionally omitted; see detail. */
export interface Component {
	name: string;
	description: string;
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
	packageName: string | null;
	importStatement: string | null;
	props: ComponentProp[];
	stories: Array< {
		name: string;
		snippet?: string;
		description?: string;
	} >;
}
