export interface ApiFetchRequestProps extends RequestInit {
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

export type ApiFetchMiddleware = (
	options: ApiFetchRequestProps,
	next: ( nextOptions: ApiFetchRequestProps ) => Promise< any >
) => Promise< any >;
