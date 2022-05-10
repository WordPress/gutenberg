/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useReducedMotion, useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Icon from '../icon';
import { useControlledState, useUpdateEffect } from '../utils';

export function PanelBody(
	{
		buttonProps = {},
		children,
		className,
		icon,
		initialOpen,
		onToggle = noop,
		opened,
		title,
		scrollAfterOpen = true,
	},
	ref
) {
	const [ isOpened, setIsOpened ] = useControlledState( opened, {
		initial: initialOpen === undefined ? true : initialOpen,
	} );
	const nodeRef = useRef();

	// Defaults to 'smooth' scrolling
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
	const scrollBehavior = useReducedMotion() ? 'auto' : 'smooth';

	const handleOnToggle = ( event ) => {
		event.preventDefault();
		const next = ! isOpened;
		setIsOpened( next );
		onToggle( next );
	};

	// Ref is used so that the effect does not re-run upon scrollAfterOpen changing value.
	const scrollAfterOpenRef = useRef();
	scrollAfterOpenRef.current = scrollAfterOpen;
	// Runs after initial render.
	useUpdateEffect( () => {
		if (
			isOpened &&
			scrollAfterOpenRef.current &&
			nodeRef.current?.scrollIntoView
		) {
			/*
			 * Scrolls the content into view when visible.
			 * This improves the UX when there are multiple stacking <PanelBody />
			 * components in a scrollable container.
			 */
			nodeRef.current.scrollIntoView( {
				inline: 'nearest',
				block: 'nearest',
				behavior: scrollBehavior,
			} );
		}
	}, [ isOpened, scrollBehavior ] );

	const classes = classnames( 'components-panel__body', className, {
		'is-opened': isOpened,
	} );

	return (
		<div className={ classes } ref={ useMergeRefs( [ nodeRef, ref ] ) }>
			<PanelBodyTitle
				icon={ icon }
				isOpened={ isOpened }
				onClick={ handleOnToggle }
				title={ title }
				{ ...buttonProps }
			/>
			{ typeof children === 'function'
				? children( { opened: isOpened } )
				: isOpened && children }
		</div>
	);
}

const PanelBodyTitle = forwardRef(
	( { isOpened, icon, title, ...props }, ref ) => {
		if ( ! title ) return null;

		return (
			<h2 className="components-panel__body-title">
				<Button
					className="components-panel__body-toggle"
					aria-expanded={ isOpened }
					ref={ ref }
					{ ...props }
				>
					{ /*
					Firefox + NVDA don't announce aria-expanded because the browser
					repaints the whole element, so this wrapping span hides that.
				*/ }
					<span aria-hidden="true">
						<Icon
							className="components-panel__arrow"
							icon={ isOpened ? chevronUp : chevronDown }
						/>
					</span>
					{ title }
					{ icon && (
						<Icon
							icon={ icon }
							className="components-panel__icon"
							size={ 20 }
						/>
					) }
				</Button>
			</h2>
		);
	}
);

const ForwardedComponent = forwardRef( PanelBody );
ForwardedComponent.displayName = 'PanelBody';

export default ForwardedComponent;
