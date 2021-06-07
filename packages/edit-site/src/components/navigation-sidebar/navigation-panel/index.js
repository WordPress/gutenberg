/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import ContentNavigation from './content-navigation';
import TemplatesNavigation from './templates-navigation';
import { MENU_ROOT } from './constants';
import { store as editSiteStore } from '../../../store';

const NavigationPanel = ( { isOpen } ) => {
	const [ contentActiveMenu, setContentActiveMenu ] = useState( MENU_ROOT );
	const { templatesActiveMenu, siteTitle } = useSelect( ( select ) => {
		const { getNavigationPanelActiveMenu } = select( editSiteStore );
		const { getEntityRecord } = select( coreDataStore );

		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			templatesActiveMenu: getNavigationPanelActiveMenu(),
			siteTitle: siteData.name,
		};
	}, [] );

	// Ensures focus is moved to the panel area when it is activated
	// from a separate component (such as document actions in the header).
	const panelRef = useRef();
	useEffect( () => {
		if ( isOpen ) {
			panelRef.current.focus();
		}
	}, [ templatesActiveMenu ] );

	const {
		setIsNavigationPanelOpened,
		setNavigationPanelActiveMenu,
	} = useDispatch( editSiteStore );

	// Sets active menu to root after the closing transition ends
	const onTransitionEnd = ( event ) => {
		if ( event.target === panelRef.current && ! isOpen ) {
			setContentActiveMenu( MENU_ROOT );
			setNavigationPanelActiveMenu( MENU_ROOT );
		}
	};

	// Skips menu slide animation if the panel has just opened or is closed
	const wasOpen = usePrevious( isOpen );
	const skipAnimation = ( isOpen && ! wasOpen ) || ! isOpen;

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			setIsNavigationPanelOpened( false );
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames( `edit-site-navigation-panel`, {
				'is-open': isOpen,
			} ) }
			ref={ panelRef }
			tabIndex="-1"
			onKeyDown={ closeOnEscape }
			onTransitionEnd={ onTransitionEnd }
		>
			<div className="edit-site-navigation-panel__inner">
				<div className="edit-site-navigation-panel__site-title-container">
					<div className="edit-site-navigation-panel__site-title">
						{ siteTitle }
					</div>
				</div>

				<div className="edit-site-navigation-panel__scroll-container">
					{ contentActiveMenu === MENU_ROOT && (
						<TemplatesNavigation skipAnimation={ skipAnimation } />
					) }
					{ templatesActiveMenu === MENU_ROOT && (
						<ContentNavigation
							skipAnimation={ skipAnimation }
							onActivateMenu={ setContentActiveMenu }
						/>
					) }
				</div>
			</div>
		</div>
	);
};

export default NavigationPanel;
