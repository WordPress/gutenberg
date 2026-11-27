export interface QueryNoResultsAttributes extends Record< string, unknown > {}

export interface QueryNoResultsBlockContext extends Record< string, unknown > {
	queryId?: number;
	query?: Record< string, unknown >;
}
