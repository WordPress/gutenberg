import {
	forwardRef,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
} from '@wordpress/element';
import { info, published, error, caution } from '@wordpress/icons';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import type { NoticeIntent, RootProps } from './types';
import type { IconProps } from '../icon/types';
import styles from './style.module.css';
import { NoticeListContext, NoticeTextContext } from './context';

const icons: { [ key in NoticeIntent ]: IconProps[ 'icon' ] | null } = {
	neutral: null,
	info,
	warning: caution,
	success: published,
	error,
};

/**
 * A notice component that communicates system status and provides actions.
 * Render inside `Notice.List` to announce added or changed messages. Outside
 * a list, it does not announce its content to assistive technology.
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
 * 			<Notice.CloseIconButton onClick={() => {}} />
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
		render,
		politeness = 'polite',
		spokenMessage,
		...restProps
	},
	ref
) {
	const list = useContext( NoticeListContext );
	const id = useId();
	const textElements = useRef(
		new Map< HTMLElement, 'title' | 'description' >()
	);
	const textContext = useMemo(
		() =>
			list && {
				register(
					element: HTMLElement,
					kind: 'title' | 'description'
				) {
					textElements.current.set( element, kind );
					list.update();
					return () => {
						textElements.current.delete( element );
						list.update();
					};
				},
			},
		[ list ]
	);
	useEffect(
		() =>
			list?.register( id, () => {
				function readText( kind: 'title' | 'description' ) {
					return Array.from( textElements.current )
						.filter(
							( [ element, type ] ) =>
								type === kind &&
								! element.closest(
									'[hidden], [aria-hidden="true"]'
								)
						)
						.sort( ( [ a ], [ b ] ) =>
							// compareDocumentPosition returns a bitmask of DOM relationships.
							// eslint-disable-next-line no-bitwise
							a.compareDocumentPosition( b ) &
							Node.DOCUMENT_POSITION_PRECEDING
								? 1
								: -1
						)
						.map( ( [ element ] ) => element.textContent?.trim() )
						.filter( Boolean )
						.join( ' ' );
				}
				const title = readText( 'title' );
				const description = readText( 'description' );
				const separator = /[.!?。！？…]$/u.test( title ) ? ' ' : '. ';
				return {
					message:
						spokenMessage ??
						( title && description
							? title + separator + description
							: title || description ),
					politeness,
				};
			} ),
		[ list, id, spokenMessage, politeness ]
	);
	const iconElement = icon === null ? null : ( icon ?? icons[ intent ] );

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
		<NoticeTextContext.Provider value={ textContext }>
			{ element }
		</NoticeTextContext.Provider>
	);
} );
