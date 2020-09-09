/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';
import mergeRefs from 'react-merge-refs';

/**
 * WordPress dependencies
 */
import { useInstanceId, useReducedMotion } from '@wordpress/compose';
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
		children,
		className,
		icon,
		initialOpen,
		onToggle = noop,
		opened,
		summary,
		title,
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

	// Runs after initial render
	useUpdateEffect( () => {
		if ( isOpened ) {
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
	}, [ isOpened, scrollBehavior ] );

	const classes = classnames( 'components-panel__body', className, {
		'is-opened': isOpened,
	} );

	return (
		<section className={ classes } ref={ mergeRefs( [ nodeRef, ref ] ) }>
			<PanelBodyHeader
				icon={ icon }
				isOpened={ isOpened }
				onClick={ handleOnToggle }
				summary={ summary }
				title={ title }
			/>
			{ isOpened && children }
		</section>
	);
}

const PanelBodyHeader = forwardRef(
	( { isOpened, icon, summary, title, ...props }, ref ) => {
		const summaryClassName = 'components-panel__body-summary';
		const summaryId = useInstanceId( PanelBodyHeader, summaryClassName );

		if ( ! title ) return null;

		const showSummary = ! isOpened && summary;

		return (
			<header className="components-panel__body-header">
				<h2 className="components-panel__body-title">
					<Button
						className="components-panel__body-toggle"
						aria-expanded={ isOpened }
						ref={ ref }
						{ ...props }
						aria-describedby={ showSummary ? summaryId : undefined }
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
				{ showSummary && (
					<div className={ summaryClassName } id={ summaryId }>
						{ summary }
					</div>
				) }
			</header>
		);
	}
);

const ForwardedComponent = forwardRef( PanelBody );
ForwardedComponent.displayName = 'PanelBody';

export default ForwardedComponent;
