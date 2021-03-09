export interface ApiFetchRequestProps {
	headers?: Record< string, string >;
	path?: string;
	url?: string;
	/**
	 * @default true
	 */
	parse?: boolean;
	data?: any;
}

export type Middleware = (
	options: ApiFetchRequestProps,
	next: ( nextOptions: ApiFetchRequestProps ) => ApiFetchRequestProps
) => ApiFetchRequestProps;
