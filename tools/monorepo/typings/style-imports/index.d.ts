declare module '*.module.css' {
	const classes: { [ key: string ]: string };
	export default classes;
}

declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}

declare module '*.css';
declare module '*.scss';

declare module '*.scss?inline' {
	const css: string;
	export default css;
}
