export interface APIFetchOptions< Parse extends boolean = boolean >
	extends RequestInit {
	// Override headers, we only accept it as an object due to the `nonce` middleware
	headers?: Record< string, string >;
	path?: string;
	url?: string;
	/**
	 * @default true
	 */
	parse?: Parse;
	data?: any;
	namespace?: string;
	endpoint?: string;
}

export type FetchHandler< Parse extends boolean = boolean > = (
	nextOptions: APIFetchOptions< Parse >
) => Promise< any >;

export type APIFetchMiddleware< Parse extends boolean = boolean > = (
	options: APIFetchOptions< Parse >,
	next: FetchHandler< Parse >
) => Promise< any >;
