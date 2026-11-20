/**
 * The properties of a template the template field reads.
 */
export interface TemplateWithTemplate {
	id: string;
	type: string;
	slug?: string;
	/**
	 * The slug of the template this one is rendered inside, or an empty
	 * string when it is rendered on its own.
	 */
	template?: string;
}
