/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';
import mergeRefs from 'react-merge-refs';
import {
	useDisclosureState,
	Disclosure,
	DisclosureContent,
} from 'reakit/Disclosure';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Icon from '../icon';
import { useUpdateEffect } from '../utils';

export function PanelBody(
	{
		children,
		className,
		icon,
		initialOpen: initialOpenProp,
		onToggle = noop,
		opened,
		title,
	},
	ref
) {
	const initialOpen = useRef( initialOpenProp ).current;
	const disclosure = useDisclosureState( {
		visible: initialOpen !== undefined ? initialOpen : opened,
	} );
	const nodeRef = useRef();

	// Defaults to 'smooth' scrolling
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
	const scrollBehavior = useReducedMotion() ? 'auto' : 'smooth';
	const isOpened = disclosure.visible;

	// Runs after initial render
	useUpdateEffect( () => {
		if ( disclosure.visible ) {
			/*
			 * Scrolls the content into view when visible.
			 * This improves the UX when there are multiple stacking <PanelBody />
			 * components in a scrollable container.
			 */
			if ( nodeRef.current.scrollIntoView ) {
				nodeRef.current.scrollIntoView( {
					inline: 'nearest',
					block: 'nearest',
					behavior: scrollBehavior,
				} );
			}
		}

		onToggle( disclosure.visible );
	}, [ disclosure.visible, scrollBehavior ] );

	useUpdateEffect( () => {
		disclosure.setVisible( opened );
	}, [ disclosure.setVisible, opened ] );

	const classes = classnames( 'components-panel__body', className, {
		'is-opened': isOpened,
	} );

	return (
		<div className={ classes } ref={ mergeRefs( [ nodeRef, ref ] ) }>
			<PanelBodyTitle title={ title } icon={ icon } { ...disclosure } />
			<DisclosureContent { ...disclosure }>
				{ children }
			</DisclosureContent>
		</div>
	);
}

const PanelBodyTitle = forwardRef(
	( { isOpened, icon, title, ...props }, ref ) => {
		if ( ! title ) return null;

		return (
			<h2 className="components-panel__body-title">
				<Disclosure
					as={ Button }
					className="components-panel__body-toggle"
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
				</Disclosure>
			</h2>
		);
	}
);

const ForwardedComponent = forwardRef( PanelBody );

export default ForwardedComponent;
