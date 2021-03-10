export interface ApiFetchRequestProps {
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
	method?: string;
}

export type ApiFetchMiddleware = (
	options: ApiFetchRequestProps,
	next: ( nextOptions: ApiFetchRequestProps ) => Promise< any >
) => Promise< any >;
