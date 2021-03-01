/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContentNavigation from './content-navigation';
import TemplatesNavigation from './templates-navigation';
import { useSelect } from '@wordpress/data';
import { MENU_ROOT } from './constants';
import { store as editSiteStore } from '../../../store';

const NavigationPanel = ( { isOpen } ) => {
	const [ contentActiveMenu, setContentActiveMenu ] = useState( MENU_ROOT );
	const { templatesActiveMenu, siteTitle } = useSelect( ( select ) => {
		const { getNavigationPanelActiveMenu } = select( editSiteStore );
		const { getEntityRecord } = select( 'core' );

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

	return (
		<div
			className={ classnames( `edit-site-navigation-panel`, {
				'is-open': isOpen,
			} ) }
			ref={ panelRef }
			tabIndex="-1"
		>
			<div className="edit-site-navigation-panel__inner">
				<div className="edit-site-navigation-panel__site-title-container">
					<div className="edit-site-navigation-panel__site-title">
						{ siteTitle }
					</div>
				</div>

				<div className="edit-site-navigation-panel__scroll-container">
					{ ( contentActiveMenu === MENU_ROOT ||
						templatesActiveMenu !== MENU_ROOT ) && (
						<TemplatesNavigation />
					) }
					{ ( templatesActiveMenu === MENU_ROOT ||
						contentActiveMenu !== MENU_ROOT ) && (
						<ContentNavigation
							onActivateMenu={ setContentActiveMenu }
						/>
					) }
				</div>
			</div>
		</div>
	);
};

export default NavigationPanel;
