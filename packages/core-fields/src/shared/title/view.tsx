import clsx from 'clsx';
import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { getItemTitle } from './get-item-title';
import type { ItemWithTitle } from './get-item-title';
import styles from './style.module.css';

/*
 * A copy of the title views of `@wordpress/fields`, laid out with `Stack`
 * instead of the `HStack` of `@wordpress/components`, and styled with a CSS
 * module. It is shared by the title fields of several collections.
 */
export function BaseTitleView( {
	item,
	className,
	children,
}: {
	item: ItemWithTitle;
	className?: string;
	children?: ReactNode;
} ) {
	const renderedTitle = getItemTitle( item );
	return (
		<Stack
			direction="row"
			align="center"
			justify="flex-start"
			className={ clsx( styles.title, className ) }
		>
			<span>{ renderedTitle || __( '(no title)' ) }</span>
			{ children }
		</Stack>
	);
}

export default function TitleView( { item }: { item: ItemWithTitle } ) {
	return <BaseTitleView item={ item } />;
}
