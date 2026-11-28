import { forwardRef } from '@wordpress/element';
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
	const iconElement = icon === null ? null : ( icon ?? icons[ intent ] );

	const mergedClassName = clsx(
		styles.notice,
		styles[ `is-${ intent }` ],
		resetStyles[ 'box-sizing' ]
	);

	const defaultProps = {
		className: mergedClassName,
		'data-wp-ui-notice-politeness': politeness,
		'data-wp-ui-notice-spoken-message': spokenMessage,
		children: (
			<>
				{ children }
				{ iconElement && (
					<Icon className={ styles.icon } icon={ iconElement } />
				) }
			</>
		),
	};
	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref,
		props: mergeProps< 'div' >( defaultProps, restProps ),
	} );

	return element;
} );
