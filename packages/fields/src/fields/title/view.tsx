/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { CommonPost } from '../../types';
import { getItemTitle } from '../../actions/utils';

export function BaseTitleView( {
	item,
	className,
	children,
}: {
	item: CommonPost;
	className?: string;
	children?: ReactNode;
} ) {
	const renderedTitle = getItemTitle( item );
	return (
		<HStack
			className={ clsx( 'fields-field__title', className ) }
			alignment="center"
			justify="flex-start"
		>
			<span>{ renderedTitle || __( '(no title)' ) }</span>
			{ children }
		</HStack>
	);
}

export default function TitleView( { item }: { item: CommonPost } ) {
	return <BaseTitleView item={ item } />;
}
