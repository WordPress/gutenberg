export interface CategoriesAttributes extends Record< string, unknown > {
	taxonomy: string;
	displayAsDropdown: boolean;
	showHierarchy: boolean;
	showPostCounts: boolean;
	showOnlyTopLevel: boolean;
	showEmpty: boolean;
	label?: string;
	showLabel: boolean;
}
