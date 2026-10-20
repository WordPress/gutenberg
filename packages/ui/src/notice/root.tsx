import { forwardRef, useContext, useId } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { info, published, error, caution } from '@wordpress/icons';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import type { NoticeIntent, RootProps } from './types';
import type { IconProps } from '../icon/types';
import styles from './style.module.css';
import { NoticeListContext } from './context';

const icons: { [ key in NoticeIntent ]: IconProps[ 'icon' ] | null } = {
	neutral: null,
	info,
	warning: caution,
	success: published,
	error,
};

// The nearest component boundary owns each message part. This also excludes
// action feedback and content in nested notices or lists.
const CONTENT_BOUNDARY = `.${ styles.notice }, .${ styles.actions }, [data-wp-ui-notice-list]`;

function readMessage( root: HTMLElement ) {
	function readText( kind: 'title' | 'description' ) {
		return Array.from(
			root.querySelectorAll< HTMLElement >( `.${ styles[ kind ] }` )
		)
			.filter(
				( element ) =>
					element.closest( CONTENT_BOUNDARY ) === root &&
					! element.closest( '[hidden], [aria-hidden="true"]' )
			)
			.map( ( element ) => element.textContent?.trim() )
			.filter( Boolean )
			.join( ' ' );
	}
	const title = readText( 'title' );
	const description = readText( 'description' );
	const separator = /[.!?。！？…]$/u.test( title ) ? ' ' : '. ';
	return title && description
		? title + separator + description
		: title || description;
}

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
	const register = useContext( NoticeListContext );
	const id = useId();
	const registrationRef = useRefEffect< HTMLDivElement >(
		( element ) =>
			register?.( id, () => ( {
				message: spokenMessage ?? readMessage( element ),
				politeness,
			} ) ),
		[ register, id, spokenMessage, politeness ]
	);
	const mergedRef = useMergeRefs( [ ref, registrationRef ] );
	const iconElement = icon === null ? null : ( icon ?? icons[ intent ] );

	const mergedClassName = clsx(
		styles.notice,
		styles[ `is-${ intent }` ],
		resetStyles[ 'box-sizing' ]
	);

	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref: mergedRef,
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

	return element;
} );
