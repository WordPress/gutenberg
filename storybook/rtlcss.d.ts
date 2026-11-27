declare module 'rtlcss' {
	const rtlcss: import( 'postcss' ).PluginCreator<
		Record< string, unknown >
	>;
	export default rtlcss;
}
