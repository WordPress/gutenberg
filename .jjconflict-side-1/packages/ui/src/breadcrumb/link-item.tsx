import { mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import { Link } from '../link';
import * as Menu from '../menu';
import * as Tooltip from '../tooltip';
import { useBreadcrumbItemRenderContext } from './context';
import { enforceRenderProps } from './enforce-render-props';
import { Item } from './item';
import {
	getMeasurementProps,
	getMeasurementRender,
} from './measurement-render';
import { Separator } from './separator';
import styles from './style.module.css';
import type { LinkItemProps } from './types';
import { useIsTruncated } from './use-is-truncated';

type LinkItemImplementationProps = LinkItemProps & {
	forwardedRef: ForwardedRef< HTMLAnchorElement >;
};

const MEASUREMENT_RENDER = <span />;

function VisibleLinkItem( {
	children,
	className,
	forwardedRef,
	href,
	openInNewTab,
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
	const linkProps = mergeProps< 'a' >(
		{ ...props, onBlur, onFocus },
		{
			'aria-current': undefined,
			children,
			className: clsx( styles.label, styles.link, className ),
			href,
			onBlur: () => onLinkBlur( itemKey ),
			onFocus: () => onLinkFocus( itemKey ),
		}
	);
	const link = (
		<Link
			{ ...linkProps }
			ref={ mergedRef }
			openInNewTab={ openInNewTab }
			render={ enforcedRender }
			tone="neutral"
		/>
	);

	return (
		<Item>
			{ showSeparator && <Separator /> }
			<Tooltip.Root disabled={ ! isTruncated }>
				<Tooltip.Trigger render={ link } />
				{ isTruncated && <Tooltip.Popup>{ children }</Tooltip.Popup> }
			</Tooltip.Root>
		</Item>
	);
}

function MeasurementLinkItem( {
	children,
	className,
	href,
	openInNewTab,
	render,
	style,
	...props
}: LinkItemProps ) {
	const { measurementRef, separatorRef, showSeparator } =
		useBreadcrumbItemRenderContext();
	const enforcedRender = enforceRenderProps(
		getMeasurementRender( render ?? MEASUREMENT_RENDER ),
		{
			'aria-current': undefined,
			href: render ? href : undefined,
		}
	);

	return (
		<Item measurement>
			{ showSeparator && <Separator ref={ separatorRef } /> }
			<span
				ref={ measurementRef }
				className={ styles[ 'measurement-content' ] }
			>
				<Link
					{ ...getMeasurementProps( props ) }
					className={ clsx(
						styles.label,
						styles.link,
						styles[ 'measurement-label' ],
						className
					) }
					href={ render ? href : undefined }
					openInNewTab={ openInNewTab }
					render={ enforcedRender }
					style={ style }
					tabIndex={ -1 }
					tone="neutral"
				>
					{ children }
				</Link>
			</span>
		</Item>
	);
}

function OverflowLinkItem( {
	children,
	forwardedRef,
	href,
	openInNewTab,
	render,
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
		}
	);

	return (
		<Menu.LinkItem
			{ ...props }
			ref={ forwardedRef as ForwardedRef< Element > }
			closeOnClick
			href={ href }
			openInNewTab={ openInNewTab }
			render={ enforcedRender }
		>
			<Menu.ItemLabel>{ children }</Menu.ItemLabel>
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

		if ( mode === 'measurement' ) {
			return <MeasurementLinkItem { ...props } />;
		}

		if ( mode === 'overflow' ) {
			return <OverflowLinkItem { ...props } forwardedRef={ ref } />;
		}

		return <VisibleLinkItem { ...props } forwardedRef={ ref } />;
	}
);

LinkItem.displayName = 'Breadcrumb.LinkItem';

export { LinkItem };
