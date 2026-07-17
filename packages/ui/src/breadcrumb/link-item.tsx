import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import * as Menu from '../menu';
import * as Tooltip from '../tooltip';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import focusStyles from '../utils/css/focus.module.css';
import resetStyles from '../utils/css/resets.module.css';
import linkStyles from '../link/style.module.css';
import { useBreadcrumbItemRenderContext } from './context';
import { enforceRenderProps } from './enforce-render-props';
import { Separator } from './separator';
import styles from './style.module.css';
import type { LinkItemProps } from './types';
import { useIsTruncated } from './use-is-truncated';

type LinkItemImplementationProps = LinkItemProps & {
	forwardedRef: ForwardedRef< HTMLAnchorElement >;
};

function VisibleLinkItem( {
	children,
	className,
	forwardedRef,
	href,
	render,
	onBlur,
	onFocus,
	...props
}: LinkItemImplementationProps ) {
	const {
		itemKey,
		measurementVersion,
		onLinkBlur,
		onLinkFocus,
		showSeparator,
	} = useBreadcrumbItemRenderContext();
	const [ element, setElement ] = useState< HTMLAnchorElement | null >(
		null
	);
	const mergedRef = useMergeRefs( [ forwardedRef, setElement ] );
	const isTruncated = useIsTruncated( element, measurementVersion );
	const enforcedRender = enforceRenderProps( render, {
		'aria-current': undefined,
		href,
	} );
	const link = useRender( {
		render: enforcedRender,
		defaultTagName: 'a',
		ref: mergedRef,
		props: mergeProps< 'a' >(
			{ ...props, onBlur, onFocus },
			{
				'aria-current': undefined,
				children,
				className: clsx(
					defenseStyles.a,
					resetStyles[ 'box-sizing' ],
					focusStyles[ 'outset-ring--focus-except-active' ],
					linkStyles.link,
					linkStyles[ 'is-neutral' ],
					styles.label,
					styles.link,
					className
				),
				href,
				onBlur: () => onLinkBlur( itemKey ),
				onFocus: () => onLinkFocus( itemKey ),
			}
		),
	} );

	return (
		<li className={ styles.item }>
			{ showSeparator && <Separator /> }
			<Tooltip.Root disabled={ ! isTruncated }>
				<Tooltip.Trigger render={ link } />
				{ isTruncated && <Tooltip.Popup>{ children }</Tooltip.Popup> }
			</Tooltip.Root>
		</li>
	);
}

function OverflowLinkItem( {
	children,
	forwardedRef,
	href,
	render,
	target,
	...props
}: LinkItemImplementationProps ) {
	const enforcedRender = enforceRenderProps(
		render ?? (
			/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid -- Menu.LinkItem clones this template with the required href and accessible content. */
			<a />
		),
		{
			'aria-current': undefined,
			href,
			target,
		}
	);

	return (
		<Menu.LinkItem
			{ ...props }
			ref={ forwardedRef as ForwardedRef< Element > }
			closeOnClick
			href={ href }
			label={ children }
			render={ enforcedRender }
		>
			{ children }
		</Menu.LinkItem>
	);
}

/**
 * Renders a navigable ancestor in a breadcrumb trail.
 *
 * Pass a complete `href`. A router-aware link can be composed through the
 * standard `render` prop.
 */
const LinkItem = forwardRef< HTMLAnchorElement, LinkItemProps >(
	function BreadcrumbLinkItem( props, ref ) {
		const { mode } = useBreadcrumbItemRenderContext();

		return mode === 'overflow' ? (
			<OverflowLinkItem { ...props } forwardedRef={ ref } />
		) : (
			<VisibleLinkItem { ...props } forwardedRef={ ref } />
		);
	}
);

LinkItem.displayName = 'Breadcrumb.LinkItem';

export { LinkItem };
