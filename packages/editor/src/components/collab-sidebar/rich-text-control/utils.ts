const EMPTY_ARRAY: string[] = [];

export function getAllowedFormats( {
	allowedFormats,
	disableFormats,
}: {
	allowedFormats?: string[];
	disableFormats?: boolean;
} ): string[] | undefined {
	if ( disableFormats ) {
		// Stable reference so consumers relying on referential equality
		// (dependency arrays, memoization) don't re-run on every call.
		return EMPTY_ARRAY;
	}

	return allowedFormats;
}
