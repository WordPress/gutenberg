import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import { ItemLayout, useItemContent } from './item-layout';
import itemLayoutStyles from './item-layout/style.module.css';
import { useNavigationMenuContext } from './context';
import styles from './style.module.scss';
import type { LinkProps } from './types';

/**
 * Renders a native navigation link. A complete `href` is required so browser
 * navigation, modifier clicks, copy-link actions, and router composition remain
 * available.
 */
const Link = forwardRef< HTMLAnchorElement, LinkProps >(
	function NavigationMenuLink(
		{
			active = false,
			children,
			className,
			closeOnClick = false,
			openInNewTab = false,
			prefix,
			shortcut,
			suffix,
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			rel,
			...props
		},
		ref
	) {
		const { orientation, registerActiveLink } = useNavigationMenuContext();
		const registrationId = useRef( {} );
		const externalLinkIndicator = openInNewTab ? (
			<span
				className={ styles[ 'external-link-indicator' ] }
				role="img"
				aria-label={
					/* translators: accessibility text appended to link text */
					__( '(opens in a new tab)' )
				}
			/>
		) : null;
		const {
			contentChildren: labelledChildren,
			itemAriaProps,
			shortcutDescriptionId,
		} = useItemContent( children, {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			shortcut,
		} );

		useEffect(
			() => registerActiveLink( registrationId.current, active ),
			[ active, registerActiveLink ]
		);

		return (
			<_NavigationMenu.Link
				ref={ ref }
				active={ active }
				closeOnClick={ closeOnClick }
				{ ...props }
				{ ...itemAriaProps }
				rel={ rel }
				target={ openInNewTab ? '_blank' : undefined }
				className={ clsx(
					defenseStyles.a,
					resetStyles[ 'box-sizing' ],
					itemLayoutStyles.item,
					styles.interactive,
					styles[ `interactive--${ orientation }` ],
					className
				) }
			>
				<ItemLayout
					labelTrailing={ externalLinkIndicator }
					prefix={ prefix }
					shortcut={ shortcut }
					shortcutDescriptionId={ shortcutDescriptionId }
					suffix={ suffix }
				>
					{ labelledChildren }
				</ItemLayout>
			</_NavigationMenu.Link>
		);
	}
);

export { Link };
