import { speak } from '@wordpress/a11y';
import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { info, published, error, caution } from '@wordpress/icons';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import { NoticeContext } from './context';
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
 * Builds the default spoken message from registered title and description text.
 */
const getDefaultSpokenMessage = (
	title: string | undefined,
	description: string | undefined
): string | undefined =>
	[ title, description ].filter( Boolean ).join( '. ' ) || undefined;

/**
 * Custom hook which announces the message with the given politeness.
 */
function useSpokenMessage(
	message: string | undefined,
	politeness: 'polite' | 'assertive'
) {
	useEffect( () => {
		if ( message ) {
			speak( message, politeness );
		}
	}, [ message, politeness ] );
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
		spokenMessage,
		politeness = getDefaultPoliteness( intent ),
		render,
		...restProps
	},
	ref
) {
	const [ title, setTitleState ] = useState< string | undefined >();
	const [ description, setDescriptionState ] = useState<
		string | undefined
	>();

	const setTitle = useCallback( ( value: string | undefined ) => {
		setTitleState( value );
	}, [] );
	const setDescription = useCallback( ( value: string | undefined ) => {
		setDescriptionState( value );
	}, [] );

	const contextValue = useMemo(
		() => ( { setTitle, setDescription } ),
		[ setTitle, setDescription ]
	);

	const resolvedSpokenMessage =
		spokenMessage ?? getDefaultSpokenMessage( title, description );

	// Announce to screen readers via speak() API - no role attribute needed
	// as it would cause double announcements
	useSpokenMessage( resolvedSpokenMessage, politeness );

	const iconElement = icon === null ? null : icon ?? icons[ intent ];

	const mergedClassName = clsx(
		styles.notice,
		styles[ `is-${ intent }` ],
		resetStyles[ 'box-sizing' ]
	);

	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref,
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
					</>
				),
			},
			restProps
		),
	} );

	return (
		<NoticeContext.Provider value={ contextValue }>
			{ element }
		</NoticeContext.Provider>
	);
} );
