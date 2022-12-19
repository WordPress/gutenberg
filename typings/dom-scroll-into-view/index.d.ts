interface Config {
	alignWithLeft?: boolean;
	alignWithTop?: boolean;
	offsetTop?: number;
	offsetLeft?: number;
	offsetBottom?: number;
	offsetRight?: number;
	allowHorizontalScroll?: boolean;
	onlyScrollIfNeeded?: boolean;
}

declare module 'dom-scroll-into-view' {
	export default function scrollIntoView(
		source: HTMLElement,
		container: HTMLElement,
		config: Config
	): void;
}
