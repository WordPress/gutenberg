import type { CSSProperties } from 'react';

export const previewStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-3xl)',
	color: 'var(--wpds-color-foreground-content-neutral)',
};

export const headingStyle: CSSProperties = {
	marginBlockEnd: 'var(--wpds-dimension-gap-xs)',
};

export const listStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-md)',
	margin: 0,
	padding: 0,
};

export const itemStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'minmax(96px, 160px) 1fr',
	alignItems: 'center',
	gap: 'var(--wpds-dimension-gap-lg)',
	padding: 'var(--wpds-dimension-padding-lg)',
	backgroundColor: 'var(--wpds-color-background-surface-neutral-weak)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
	borderRadius: 'var(--wpds-border-radius-sm)',
};

export const tokenNameStyle: CSSProperties = {
	fontFamily: 'var(--wpds-typography-font-family-mono)',
	fontSize: 'var(--wpds-typography-font-size-sm)',
	lineHeight: 'var(--wpds-typography-line-height-sm)',
	overflowWrap: 'anywhere',
};

export const descriptionStyle: CSSProperties = {
	margin: 0,
	fontSize: 'var(--wpds-typography-font-size-sm)',
	lineHeight: 'var(--wpds-typography-line-height-sm)',
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
};

export const textStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-xs)',
	minWidth: 0,
	margin: 0,
};
