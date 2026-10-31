import { useRender } from '@base-ui/react';
import {
	useDayPicker,
	type CalendarDay,
	type RootProps,
} from '@daypicker/react';
import { useContext } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { IconButton } from '../../icon-button';
import { RootContext } from './root-context';
import type { Modifiers } from '../types';

/**
 * Render a grid cell for a specific day in the calendar.
 *
 * Handles interaction and focus for the day.
 * @see https://daypicker.dev/guides/custom-components
 */
export function Day(
	props: {
		/** The day to render. */
		day: CalendarDay;
		/** The modifiers to apply to the day. */
		modifiers: Modifiers;
	} & React.HTMLAttributes< HTMLDivElement >
) {
	const { day, modifiers, children, ...tdProps } = props;

	return (
		<td { ...tdProps }>
			{ modifiers.preview && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					strokeDasharray="4 4"
					strokeDashoffset="2"
					strokeWidth="1"
					data-preview-start={ modifiers.preview_start || undefined }
					data-preview-end={ modifiers.preview_end || undefined }
				>
					<rect />
				</svg>
			) }
			{ children }
		</td>
	);
}

/**
 * Render the root element of the calendar.
 *
 * Wired to `useRender` so that consumers can swap the underlying element
 * through the `render` prop, like every other `@wordpress/ui` component.
 * @see https://daypicker.dev/guides/custom-components
 */
export function Root( { rootRef, ...props }: RootProps ) {
	const { render, ref, role, defaultAriaLabel } = useContext( RootContext );
	const { months, labels } = useDayPicker();
	const hasExplicitLabel =
		props[ 'aria-label' ] !== undefined ||
		props[ 'aria-labelledby' ] !== undefined;
	let ariaLabel = props[ 'aria-label' ];

	if ( ! hasExplicitLabel && defaultAriaLabel && role === 'application' ) {
		const currentMonth = months[ 0 ];
		ariaLabel = currentMonth
			? sprintf(
					// translators: 1: Calendar type. 2: Current month and year.
					__( '%1$s, %2$s' ),
					defaultAriaLabel,
					labels.labelGrid( currentMonth.date )
				)
			: defaultAriaLabel;
	}

	// `rootRef` is only set by `@daypicker/react` when `animate` is enabled.
	const mergedRef = useMergeRefs( [ rootRef ?? null, ref ?? null ] );

	return useRender( {
		render,
		defaultTagName: 'div',
		ref: mergedRef,
		props: { ...props, role, 'aria-label': ariaLabel },
	} );
}

/**
 * Render a month navigation button.
 *
 * `@daypicker/react` marks the button as `aria-disabled` (rather than
 * `disabled`) when there is no month to navigate to, so that it stays
 * discoverable. `IconButton`'s `focusableWhenDisabled` produces the same DOM.
 * It also always provides the string returned by its navigation label formatter
 * as `aria-label`; the native button prop type cannot express that requirement.
 * @see https://daypicker.dev/guides/custom-components
 */
function NavButton( {
	icon,
	className,
	children: _children,
	'aria-label': label,
	'aria-disabled': ariaDisabled,
	...props
}: React.ButtonHTMLAttributes< HTMLButtonElement > & {
	icon: React.ComponentProps< typeof IconButton >[ 'icon' ];
} ) {
	return (
		<IconButton
			{ ...props }
			className={ className }
			label={ label as string }
			icon={ icon }
			variant="minimal"
			tone="neutral"
			size="compact"
			disabled={ ariaDisabled === true || ariaDisabled === 'true' }
			focusableWhenDisabled
		/>
	);
}

export function PreviousMonthButton(
	props: React.ButtonHTMLAttributes< HTMLButtonElement >
) {
	return <NavButton { ...props } icon={ chevronLeft } />;
}

export function NextMonthButton(
	props: React.ButtonHTMLAttributes< HTMLButtonElement >
) {
	return <NavButton { ...props } icon={ chevronRight } />;
}
