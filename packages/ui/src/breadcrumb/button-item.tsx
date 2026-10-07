import { mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import { Button } from '../button';
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
import type { ButtonItemElement, ButtonItemProps } from './types';
import { useIsTruncated } from './use-is-truncated';

const MEASUREMENT_RENDER = <span />;

function TrailButtonItem( {
	children,
	className,
	forwardedRef,
	render,
	...props
}: ButtonItemProps & { forwardedRef: ForwardedRef< ButtonItemElement > } ) {
	const {
		itemKey,
		mode,
		measurementRef,
		measurementVersion,
		onLinkBlur,
		onLinkFocus,
		separatorRef,
		showSeparator,
	} = useBreadcrumbItemRenderContext();
	const isMeasurement = mode === 'measurement';
	const [ element, setElement ] = useState< HTMLButtonElement | null >(
		null
	);
	const mergedRef = useMergeRefs( [
		forwardedRef as ForwardedRef< HTMLButtonElement >,
		setElement,
	] );
	const isTruncated = useIsTruncated( element, measurementVersion );
	const button = (
		<Button
			{ ...( isMeasurement
				? getMeasurementProps( props )
				: mergeProps< 'button' >( props, {
						onBlur: () => onLinkBlur( itemKey ),
						onFocus: () => onLinkFocus( itemKey ),
					} ) ) }
			ref={ isMeasurement ? undefined : mergedRef }
			className={ clsx(
				styles.label,
				styles.link,
				isMeasurement && styles[ 'measurement-label' ],
				className
			) }
			render={ enforceRenderProps(
				isMeasurement
					? getMeasurementRender( render ?? MEASUREMENT_RENDER )
					: render,
				{
					'aria-current': undefined,
					type: isMeasurement ? undefined : 'button',
				}
			) }
			nativeButton={ ! isMeasurement || !! render }
			size="small"
			tone="neutral"
			type={ isMeasurement ? undefined : 'button' }
			variant="minimal"
			tabIndex={ isMeasurement ? -1 : props.tabIndex }
		>
			{ children }
		</Button>
	);

	return (
		<Item measurement={ isMeasurement }>
			{ showSeparator && (
				<Separator ref={ isMeasurement ? separatorRef : undefined } />
			) }
			{ isMeasurement ? (
				<span
					ref={ measurementRef }
					className={ styles[ 'measurement-content' ] }
				>
					{ button }
				</span>
			) : (
				<Tooltip.Root disabled={ ! isTruncated }>
					<Tooltip.Trigger render={ button } />
					{ isTruncated && (
						<Tooltip.Popup>{ children }</Tooltip.Popup>
					) }
				</Tooltip.Root>
			) }
		</Item>
	);
}

/**
 * Selects or activates an ancestor in the same hierarchy. The visible item is a
 * native button; a collapsed item is a menu action. Refs and event currentTarget
 * refer to an HTMLButtonElement in the trail and an HTMLDivElement in the menu.
 */
const ButtonItem = forwardRef< ButtonItemElement, ButtonItemProps >(
	function BreadcrumbButtonItem( { children, onClick, ...props }, ref ) {
		const { mode, onButtonActivate } = useBreadcrumbItemRenderContext();
		if ( mode === 'overflow' ) {
			return (
				<Menu.Item
					{ ...props }
					onClick={ ( event ) => {
						const ownerDocument = event.currentTarget.ownerDocument;
						onClick?.( event );
						const active = ownerDocument.activeElement;
						onButtonActivate?.(
							active !== ownerDocument.body &&
								! event.currentTarget
									.closest( '[role="menu"]' )
									?.contains( active )
								? ( active as HTMLElement )
								: null
						);
					} }
					ref={ ref as ForwardedRef< HTMLDivElement > }
					closeOnClick
				>
					<Menu.ItemLabel>{ children }</Menu.ItemLabel>
				</Menu.Item>
			);
		}
		return (
			<TrailButtonItem
				{ ...props }
				onClick={ onClick }
				forwardedRef={ ref }
			>
				{ children }
			</TrailButtonItem>
		);
	}
);

ButtonItem.displayName = 'Breadcrumb.ButtonItem';

export { ButtonItem };
