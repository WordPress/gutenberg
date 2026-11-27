export interface TagCloudAttributes extends Record< string, unknown > {
	numberOfTags: number;
	taxonomy: string;
	showTagCounts: boolean;
	smallestFontSize: string;
	largestFontSize: string;
}
