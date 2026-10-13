import { useRender } from '@base-ui/react';
import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { person } from '@wordpress/icons';
import { Icon } from '../icon';
import type { FallbackProps } from './types';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';

function FallbackElement( {
	elementProps,
	render,
	enabled,
}: {
	elementProps: React.ComponentPropsWithRef< 'span' >;
	render: FallbackProps[ 'render' ];
	enabled: boolean;
} ) {
	return useRender( {
		defaultTagName: 'span',
		render,
		props: { ...elementProps },
		enabled,
	} );
}

/**
 * The content shown while the image loads, when it fails, or when no image
 * is provided. Without children, displays a borderless person icon.
 * Supply initials, an icon, or other content to customize the fallback.
 * Direct SVG children scale with the avatar; inline styles can override their size.
 * Use `delay` to postpone showing the fallback while an image is loading.
 * Missing and failed images show the fallback immediately.
 * The delay starts when this part mounts, not when each image request starts.
 */
export const Fallback = forwardRef< HTMLSpanElement, FallbackProps >(
	function AvatarFallback(
		{
			className,
			children = (
				<Icon
					icon={ person }
					role="presentation"
					className={ styles[ 'person-icon' ] }
				/>
			),
			delay = 0,
			render,
			...props
		},
		ref
	) {
		const [ delayPassed, setDelayPassed ] = useState( delay === 0 );

		useEffect( () => {
			if ( delay === 0 ) {
				setDelayPassed( true );
				return;
			}
			const timeout = setTimeout( () => setDelayPassed( true ), delay );
			return () => clearTimeout( timeout );
		}, [ delay ] );

		return (
			<_Avatar.Fallback
				ref={ ref }
				className={ clsx(
					styles.fallback,
					defenseStyles.span,
					className
				) }
				{ ...props }
				delay={ 0 }
				render={ ( elementProps, { imageLoadingStatus } ) => (
					<FallbackElement
						elementProps={ elementProps }
						render={ render }
						enabled={
							imageLoadingStatus !== 'loading' || delayPassed
						}
					/>
				) }
			>
				{ children }
			</_Avatar.Fallback>
		);
	}
);
