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

export type ApiFetchMiddleware< T = any > = (
	options: ApiFetchRequestProps,
	next: ( nextOptions: ApiFetchRequestProps ) => ApiFetchRequestProps
) => ApiFetchRequestProps | Promise< T >;
