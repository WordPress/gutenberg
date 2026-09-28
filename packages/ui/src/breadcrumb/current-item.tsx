import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import * as Tooltip from '../tooltip';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import focusStyles from '../utils/css/focus.module.scss';
import resetStyles from '../utils/css/resets.module.css';
import { useBreadcrumbItemRenderContext } from './context';
import { enforceRenderProps } from './enforce-render-props';
import { Item } from './item';
import {
	getMeasurementProps,
	getMeasurementRender,
} from './measurement-render';
import { Separator } from './separator';
import styles from './style.module.css';
import type { CurrentItemProps } from './types';
import { useIsTruncated } from './use-is-truncated';

type CurrentItemImplementationProps = CurrentItemProps & {
	forwardedRef: ForwardedRef< HTMLSpanElement >;
};

const MEASUREMENT_RENDER = <span />;

function VisibleCurrentItem( {
	children,
	className,
	forwardedRef,
	onBlur,
	onFocus,
	render,
	...props
}: CurrentItemImplementationProps ) {
	const { measurementVersion, showSeparator, shouldTruncateCurrent } =
		useBreadcrumbItemRenderContext();
	const [ element, setElement ] = useState< HTMLSpanElement | null >( null );
	const [ isFocusPinned, setIsFocusPinned ] = useState( false );
	const mergedRef = useMergeRefs( [ forwardedRef, setElement ] );
	const isTruncated = useIsTruncated( element, measurementVersion );
	const tabIndex = isTruncated || isFocusPinned ? 0 : undefined;
	const enforcedRender = enforceRenderProps( render, {
		'aria-current': 'page',
		href: undefined,
		tabIndex,
	} );
	const currentItem = useRender( {
		render: enforcedRender,
		defaultTagName: 'span',
		ref: mergedRef,
		props: mergeProps< 'span' >(
			{ ...props, onBlur, onFocus },
			{
				'aria-current': 'page',
				children,
				className: clsx(
					defenseStyles.div,
					resetStyles[ 'box-sizing' ],
					styles.label,
					styles.current,
					( isTruncated || isFocusPinned ) &&
						focusStyles[ 'outset-ring--focus-visible' ],
					className
				),
				onBlur: () => setIsFocusPinned( false ),
				onFocus: () => {
					if ( isTruncated ) {
						setIsFocusPinned( true );
					}
				},
				tabIndex,
			}
		),
	} );

	return (
		<Item
			className={ clsx(
				styles[ 'current-item' ],
				shouldTruncateCurrent && styles[ 'current-item--truncating' ]
			) }
		>
			{ showSeparator && <Separator /> }
			<Tooltip.Root disabled={ ! isTruncated }>
				<Tooltip.Trigger render={ currentItem } />
				{ isTruncated && <Tooltip.Popup>{ children }</Tooltip.Popup> }
			</Tooltip.Root>
		</Item>
	);
}

function MeasurementCurrentItem( {
	children,
	className,
	render,
	style,
	...props
}: CurrentItemProps ) {
	const { measurementRef, separatorRef, showSeparator } =
		useBreadcrumbItemRenderContext();
	const enforcedRender = enforceRenderProps(
		getMeasurementRender( render ?? MEASUREMENT_RENDER ),
		{
			'aria-current': undefined,
			href: undefined,
			tabIndex: undefined,
		}
	);
	const currentItem = useRender( {
		render: enforcedRender,
		defaultTagName: 'span',
		props: {
			...getMeasurementProps( props ),
			children,
			className: clsx(
				defenseStyles.div,
				resetStyles[ 'box-sizing' ],
				styles.label,
				styles.current,
				styles[ 'measurement-label' ],
				className
			),
			style,
		},
	} );

	return (
		<Item measurement className={ styles[ 'current-item' ] }>
			{ showSeparator && <Separator ref={ separatorRef } /> }
			<span
				ref={ measurementRef }
				className={ styles[ 'measurement-content' ] }
			>
				{ currentItem }
			</span>
		</Item>
	);
}

/**
 * Renders the current, non-navigable page in a breadcrumb trail.
 */
const CurrentItem = forwardRef< HTMLSpanElement, CurrentItemProps >(
	function BreadcrumbCurrentItem( props, ref ) {
		const { mode } = useBreadcrumbItemRenderContext();

		return mode === 'measurement' ? (
			<MeasurementCurrentItem { ...props } />
		) : (
			<VisibleCurrentItem { ...props } forwardedRef={ ref } />
		);
	}
);

CurrentItem.displayName = 'Breadcrumb.CurrentItem';

export { CurrentItem };
