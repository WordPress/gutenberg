/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from '../navigation-link/icons';
import {
	getColors,
	getNavigationChildBlockProps,
} from '../navigation/edit/utils';

/**
 * Hook: Get front page ID (same as core logic)
 *
 * @return {number|undefined} The front page ID if set.
 */
function useFrontPageId() {
	return useSelect( ( select ) => {
		const canReadSettings = select( coreStore ).canUser( 'read', {
			kind: 'root',
			name: 'site',
		} );
		if ( ! canReadSettings ) {
			return undefined;
		}
		const site = select( coreStore ).getEntityRecord( 'root', 'site' );
		return site?.show_on_front === 'page' && site?.page_on_front;
	}, [] );
}
/**
 * Component: PageListItemEdit
 *
 * Fixes aria-expanded mismatch for submenu toggle buttons (a11y)
 *
 * @param {Object} root0            - Component props.
 * @param {Object} root0.context    - Context passed from parent block.
 * @param {Object} root0.attributes - Block attributes.
 * @return {JSX.Element} Rendered element.
 */
/* global MutationObserver */

export default function PageListItemEdit( { context, attributes } ) {
	const { id, label, link, hasChildren, title } = attributes;
	const isNavigationChild = 'showSubmenuIcon' in context;
	const frontPageId = useFrontPageId();

	// === Accessibility fix additions ===
	const submenuRef = useRef( null );
	const [ submenuVisible, setSubmenuVisible ] = useState( false );

	useEffect( () => {
		const el = submenuRef.current;
		if ( ! el ) {
			setSubmenuVisible( false );
			return;
		}

		const isDomVisible = () => {
			if ( el.offsetParent !== null ) {
				return true;
			}
			const style = window.getComputedStyle( el );
			if ( ! style ) {
				return false;
			}
			return (
				style.display !== 'none' &&
				style.visibility !== 'hidden' &&
				style.opacity !== '0'
			);
		};

		setSubmenuVisible( isDomVisible() );

		const observer = new MutationObserver( () =>
			setSubmenuVisible( isDomVisible() )
		);
		observer.observe( el, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
		} );

		const onResize = () => setSubmenuVisible( isDomVisible() );
		window.addEventListener( 'resize', onResize );

		return () => {
			observer.disconnect();
			window.removeEventListener( 'resize', onResize );
		};
	}, [] );

	// Determine if the button actually controls the submenu.
	let ariaExpandedValue;
	const buttonShouldControl = !! context.openSubmenusOnClick;
	if ( buttonShouldControl && ! submenuVisible ) {
		ariaExpandedValue = 'false';
	} else if ( buttonShouldControl && submenuVisible ) {
		ariaExpandedValue = 'true';
	} else {
		ariaExpandedValue = undefined;
	}
	// === End of fix logic ===
	const innerBlocksColors = getColors( context, true );
	const navigationChildBlockProps =
		getNavigationChildBlockProps( innerBlocksColors );
	const blockProps = useBlockProps( navigationChildBlockProps, {
		className: 'wp-block-pages-list__item',
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<li
			key={ id }
			className={ clsx( 'wp-block-pages-list__item', {
				'has-child': hasChildren,
				'wp-block-navigation-item': isNavigationChild,
				'open-on-click': context.openSubmenusOnClick,
				'open-on-hover-click':
					! context.openSubmenusOnClick && context.showSubmenuIcon,
				'menu-item-home': id === frontPageId,
			} ) }
		>
			{ hasChildren && context.openSubmenusOnClick ? (
				<>
					<button
						type="button"
						className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
						// Only render aria-expanded if button truly controls submenu visibility
						{ ...( ariaExpandedValue !== undefined
							? { 'aria-expanded': ariaExpandedValue }
							: {} ) }
					>
						{ decodeEntities( label ) }
					</button>
					<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				</>
			) : (
				<a
					className={ clsx( 'wp-block-pages-list__item__link', {
						'wp-block-navigation-item__content': isNavigationChild,
					} ) }
					href={ link }
				>
					{ decodeEntities( title ) }
				</a>
			) }

			{ hasChildren && (
				<>
					{ ! context.openSubmenusOnClick &&
						context.showSubmenuIcon && (
							<button
								className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon"
								type="button"
								// Only render aria-expanded if it's a real controller
								{ ...( buttonShouldControl &&
								ariaExpandedValue !== undefined
									? { 'aria-expanded': ariaExpandedValue }
									: {} ) }
							>
								<ItemSubmenuIcon />
							</button>
						) }
					<ul ref={ submenuRef } { ...innerBlocksProps }></ul>
				</>
			) }
		</li>
	);
}
