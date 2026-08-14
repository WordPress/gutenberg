import { speak } from '@wordpress/a11y';
import { forwardRef, useEffect, useRef } from '@wordpress/element';
import { info, published, error, caution } from '@wordpress/icons';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import type { NoticeIntent, RootProps } from './types';
import type { IconProps } from '../icon/types';
import styles from './style.module.css';

const icons: { [ key in NoticeIntent ]: IconProps[ 'icon' ] | null } = {
	neutral: null,
	info,
	warning: caution,
	success: published,
	error,
};

/**
 * Returns the default politeness level based on the notice intent.
 * Error uses 'assertive' for urgent announcements, others use 'polite'.
 */
function getDefaultPoliteness( intent: NoticeIntent ): 'polite' | 'assertive' {
	return intent === 'error' ? 'assertive' : 'polite';
}

/**
 * Custom hook which announces the message with the given politeness.
 *
 * A non-string message is read from the DOM node the returned ref is attached
 * to, rather than serialized with `renderToString`. Serializing during render
 * invokes the message components as plain functions, so any hooks they use
 * would be registered against the component rendering the notice, crashing it
 * when the message changes shape. See
 * https://github.com/WordPress/gutenberg/issues/61199.
 */
function useSpokenMessage(
	message: RootProps[ 'spokenMessage' ],
	politeness: 'polite' | 'assertive'
) {
	const messageContainerRef = useRef< HTMLDivElement >( null );
	const previouslySpokenRef = useRef< {
		message: string;
		politeness: 'polite' | 'assertive';
	} >();

	useEffect( () => {
		const spokenMessage =
			typeof message === 'string'
				? message
				: messageContainerRef.current?.innerHTML;

		if (
			spokenMessage &&
			( spokenMessage !== previouslySpokenRef.current?.message ||
				politeness !== previouslySpokenRef.current?.politeness )
		) {
			previouslySpokenRef.current = {
				message: spokenMessage,
				politeness,
			};
			speak( spokenMessage, politeness );
		}
	} );

	return messageContainerRef;
}

/**
 * A notice component that communicates system status and provides actions.
 *
 * ```jsx
 * import { Notice } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<Notice.Root intent="info">
 * 			<Notice.Title>Heading</Notice.Title>
 * 			<Notice.Description>Body text</Notice.Description>
 * 			<Notice.Actions>
 * 				<Notice.ActionButton>Action</Notice.ActionButton>
 * 			</Notice.Actions>
 * 			<Notice.CloseIcon onClick={() => {}} />
 * 		</Notice.Root>
 * 	);
 * }
 * ```
 */
export const Root = forwardRef< HTMLDivElement, RootProps >( function Notice(
	{
		intent = 'neutral',
		children,
		icon,
		spokenMessage = children,
		politeness = getDefaultPoliteness( intent ),
		render,
		...restProps
	},
	ref
) {
	// Announce to screen readers via speak() API - no role attribute needed
	// as it would cause double announcements
	const spokenMessageRef = useSpokenMessage( spokenMessage, politeness );

	// When `spokenMessage` is a distinct element (not the default `children`
	// and not a string), it has no place in the rendered output to read the
	// announcement from, so render it in a hidden container. Otherwise the
	// message is read from the root element itself.
	const isSpokenMessageDistinctElement =
		typeof spokenMessage !== 'string' &&
		spokenMessage !== children &&
		spokenMessage !== null &&
		spokenMessage !== undefined;

	const iconElement = icon === null ? null : icon ?? icons[ intent ];

	const mergedClassName = clsx(
		styles.notice,
		styles[ `is-${ intent }` ],
		resetStyles[ 'box-sizing' ]
	);

	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref: isSpokenMessageDistinctElement ? ref : [ ref, spokenMessageRef ],
		props: mergeProps< 'div' >(
			{
				className: mergedClassName,
				children: (
					<>
						{ children }
						{ iconElement && (
							<Icon
								className={ styles.icon }
								icon={ iconElement }
							/>
						) }
						{ isSpokenMessageDistinctElement && (
							<div hidden ref={ spokenMessageRef }>
								{ spokenMessage }
							</div>
						) }
					</>
				),
			},
			restProps
		),
	} );

	return element;
} );
