/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { CommonPost } from '../../types';
import { getItemTitleWithFallbackSnippet } from '../../actions/utils';

export function BaseTitleView( {
	item,
	className,
	children,
}: {
	item: CommonPost;
	className?: string;
	children?: ReactNode;
} ) {
	const renderedTitle = getItemTitleWithFallbackSnippet( item );
	return (
		<HStack
			className={ clsx( 'fields-field__title', className ) }
			alignment="center"
			justify="flex-start"
		>
			<span>{ renderedTitle }</span>
			{ children }
		</HStack>
	);
}

export default function TitleView( { item }: { item: CommonPost } ) {
	return <BaseTitleView item={ item } />;
}
