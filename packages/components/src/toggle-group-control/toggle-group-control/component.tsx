/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks';
import BaseControl from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import { VisualLabelWrapper } from './styles';
import * as styles from './styles';
import { ToggleGroupControlAsRadioGroup } from './as-radio-group';
import { ToggleGroupControlAsButtonGroup } from './as-button-group';
import type { ElementOffsetRect } from '../../utils/element-rect';
import { useTrackElementOffsetRect } from '../../utils/element-rect';
import { useOnValueUpdate } from '../../utils/hooks/use-on-value-update';
import { useEvent, useMergeRefs } from '@wordpress/compose';

/**
 * A utility used to animate something in a container component based on the "offset
 * rect" (position relative to the container and size) of a subelement. For example,
 * this is useful to render an indicator for the selected option of a component, and
 * to animate it when the selected option changes.
 *
 * Takes in a container element and the up-to-date "offset rect" of the target
 * subelement, obtained with `useTrackElementOffsetRect`. Then it does the following:
 *
 * - Adds CSS variables with rect information to the container, so that the indicator
 *   can be rendered and animated with them. These are kept up-to-date, enabling CSS
 *   transitions on change.
 * - Sets an attribute (`data-subelement-animated` by default) when the tracked
 *   element changes, so that the target (e.g. the indicator) can be animated to its
 *   new size and position.
 * - Removes the attribute when the animation is done.
 *
 * The need for the attribute is due to the fact that the rect might update in
 * situations other than when the tracked element changes, e.g. the tracked element
 * might be resized. In such cases, there is no need to animate the indicator, and
 * the change in size or position of the indicator needs to be reflected immediately.
 */
function useAnimatedOffsetRect(
	/**
	 * The container element.
	 */
	container: HTMLElement | undefined,
	/**
	 * The rect of the tracked element.
	 */
	rect: ElementOffsetRect,
	{
		prefix = 'subelement',
		dataAttribute = `${ prefix }-animated`,
		transitionEndFilter = () => true,
	}: {
		/**
		 * The prefix used for the CSS variables, e.g. if `prefix` is `selected`, the
		 * CSS variables will be `--selected-top`, `--selected-left`, etc.
		 * @default 'subelement'
		 */
		prefix?: string;
		/**
		 * The name of the data attribute used to indicate that the animation is in
		 * progress. The `data-` prefix is added automatically.
		 *
		 * For example, if `dataAttribute` is `indicator-animated`, the attribute will
		 * be `data-indicator-animated`.
		 * @default `${ prefix }-animated`
		 */
		dataAttribute?: string;
		/**
		 * A function that is called with the transition event and returns a boolean
		 * indicating whether the animation should be stopped. The default is a function
		 * that always returns `true`.
		 *
		 * For example, if the animated element is the `::before` pseudo-element, the
		 * function can be written as `( event ) => event.pseudoElement === '::before'`.
		 * @default () => true
		 */
		transitionEndFilter?: ( event: TransitionEvent ) => boolean;
	} = {}
) {
	const setProperties = useEvent( () => {
		( Object.keys( rect ) as Array< keyof typeof rect > ).forEach(
			( property ) =>
				property !== 'element' &&
				container?.style.setProperty(
					`--${ prefix }-${ property }`,
					String( rect[ property ] )
				)
		);
	} );
	useLayoutEffect( () => {
		setProperties();
	}, [ rect, setProperties ] );
	useOnValueUpdate( rect.element, ( { previousValue } ) => {
		// Only enable the animation when moving from one element to another.
		if ( rect.element && previousValue ) {
			container?.setAttribute( `data-${ dataAttribute }`, '' );
		}
	} );
	useLayoutEffect( () => {
		function onTransitionEnd( event: TransitionEvent ) {
			if ( transitionEndFilter( event ) ) {
				container?.removeAttribute( `data-${ dataAttribute }` );
			}
		}
		container?.addEventListener( 'transitionend', onTransitionEnd );
		return () =>
			container?.removeEventListener( 'transitionend', onTransitionEnd );
	}, [ dataAttribute, container, transitionEndFilter ] );
}

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
		__next40pxDefaultSize = false,
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		isDeselectable = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange,
		size = 'default',
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );

	const normalizedSize =
		__next40pxDefaultSize && size === 'default' ? '__unstable-large' : size;

	const [ selectedElement, setSelectedElement ] = useState< HTMLElement >();
	const [ controlElement, setControlElement ] = useState< HTMLElement >();
	const refs = useMergeRefs( [ setControlElement, forwardedRef ] );
	const selectedRect = useTrackElementOffsetRect(
		value ? selectedElement : undefined
	);
	useAnimatedOffsetRect( controlElement, selectedRect, {
		prefix: 'selected',
		dataAttribute: 'indicator-animated',
		transitionEndFilter: ( event ) => event.pseudoElement === '::before',
	} );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.toggleGroupControl( {
					isBlock,
					isDeselectable,
					size: normalizedSize,
				} ),
				isBlock && styles.block,
				className
			),
		[ className, cx, isBlock, isDeselectable, normalizedSize ]
	);

	const MainControl = isDeselectable
		? ToggleGroupControlAsButtonGroup
		: ToggleGroupControlAsRadioGroup;

	return (
		<BaseControl
			help={ help }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			__associatedWPComponentName="ToggleGroupControl"
		>
			{ ! hideLabelFromVision && (
				<VisualLabelWrapper>
					<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
				</VisualLabelWrapper>
			) }
			<MainControl
				{ ...otherProps }
				setSelectedElement={ setSelectedElement }
				className={ classes }
				isAdaptiveWidth={ isAdaptiveWidth }
				label={ label }
				onChange={ onChange }
				ref={ refs }
				size={ normalizedSize }
				value={ value }
			>
				{ children }
			</MainControl>
		</BaseControl>
	);
}

/**
 * `ToggleGroupControl` is a form component that lets users choose options
 * represented in horizontal segments. To render options for this control use
 * `ToggleGroupControlOption` component.
 *
 * This component is intended for selecting a single persistent value from a set of options,
 * similar to a how a radio button group would work. If you simply want a toggle to switch between views,
 * use a `TabPanel` instead.
 *
 * Only use this control when you know for sure the labels of items inside won't
 * wrap. For items with longer labels, you can consider a `SelectControl` or a
 * `CustomSelectControl` component instead.
 *
 * ```jsx
 * import {
 *   __experimentalToggleGroupControl as ToggleGroupControl,
 *   __experimentalToggleGroupControlOption as ToggleGroupControlOption,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ToggleGroupControl
 *       label="my label"
 *       value="vertical"
 *       isBlock
 *       __nextHasNoMarginBottom
 *     >
 *       <ToggleGroupControlOption value="horizontal" label="Horizontal" />
 *       <ToggleGroupControlOption value="vertical" label="Vertical" />
 *     </ToggleGroupControl>
 *   );
 * }
 * ```
 */
export const ToggleGroupControl = contextConnect(
	UnconnectedToggleGroupControl,
	'ToggleGroupControl'
);

export default ToggleGroupControl;
