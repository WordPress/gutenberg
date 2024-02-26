export function useDeprecated36pxDefaultSizeProp<
	P extends Record< string, any > & {
		__next36pxDefaultSize?: boolean;
		__next40pxDefaultSize?: boolean;
	},
>( props: P ) {
	const { __next36pxDefaultSize, __next40pxDefaultSize, ...otherProps } =
		props;

	return {
		...otherProps,
		__next40pxDefaultSize: __next40pxDefaultSize ?? __next36pxDefaultSize,
	};
}
