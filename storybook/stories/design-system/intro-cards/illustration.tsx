import styles from './style.module.scss';
import { surfaceWeak } from './palette';

export const Illustration = ( { children }: { children: React.ReactNode } ) => (
	<svg
		viewBox="0 0 320 160"
		preserveAspectRatio="xMidYMid slice"
		className={ styles.illustration }
		aria-hidden="true"
		focusable="false"
	>
		<rect width="320" height="160" fill={ surfaceWeak } />
		{ children }
	</svg>
);
