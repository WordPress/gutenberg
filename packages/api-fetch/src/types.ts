export interface APIFetchOptions extends RequestInit {
	// Override headers, we only accept it as an object due to the `nonce` middleware
	headers?: Record< string, string >;
	path?: string;
	url?: string;
	/**
	 * @default true
	 */
	parse?: boolean;
	data?: any;
	namespace?: string;
	endpoint?: string;
}

export type APIFetchMiddleware = (
	options: APIFetchOptions,
	next: ( nextOptions: APIFetchOptions ) => Promise< any >
) => Promise< any >;
