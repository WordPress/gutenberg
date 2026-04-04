declare module 'chrome-remote-interface' {
	interface CDPOptions {
		host?: string;
		port?: number;
		target?: string;
	}

	function CDP( options?: CDPOptions ): Promise< unknown >;
	export default CDP;
}
