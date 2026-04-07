/**
 * Shared XHR mock for upload/sideload tests.
 */
export const xhrState: { instance: any } = { instance: null };

export class MockXMLHttpRequest {
	upload: { onprogress: ( ( e: any ) => void ) | null };
	onload: ( () => void ) | null;
	onerror: ( () => void ) | null;
	onabort: ( () => void ) | null;
	status: number;
	responseText: string;
	withCredentials: boolean;
	headers: Record< string, string >;

	constructor() {
		this.upload = { onprogress: null };
		this.onload = null;
		this.onerror = null;
		this.onabort = null;
		this.status = 200;
		this.responseText = '';
		this.withCredentials = false;
		this.headers = {};
		xhrState.instance = this;
	}

	open = jest.fn();
	send = jest.fn();
	abort = jest.fn();
	setRequestHeader = jest.fn(
		( name: string, value: string ) => ( this.headers[ name ] = value )
	);
}

export const OriginalXHR = globalThis.XMLHttpRequest;

export function installMockXhr() {
	xhrState.instance = null;
	( globalThis as any ).XMLHttpRequest = MockXMLHttpRequest;
}

export function uninstallMockXhr() {
	( globalThis as any ).XMLHttpRequest = OriginalXHR;
}
