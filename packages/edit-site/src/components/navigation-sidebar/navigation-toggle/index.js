/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store/index';

function NavigationToggle( {
	icon,
	isOpen,
	size = '36px',
	className = '',
	label = __( 'Toggle navigation' ),
} ) {
	const {
		isRequestingSiteIcon,
		navigationPanelMenu,
		siteIconUrl,
	} = useSelect( ( select ) => {
		const { getCurrentTemplateNavigationPanelSubMenu } = select(
			editSiteStore
		);
		const { getEntityRecord, isResolving } = select( coreDataStore );
		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			isRequestingSiteIcon: isResolving( 'core', 'getEntityRecord', [
				'root',
				'__unstableBase',
				undefined,
			] ),
			navigationPanelMenu: getCurrentTemplateNavigationPanelSubMenu(),
			siteIconUrl: siteData.site_icon_url,
		};
	}, [] );

	const {
		openNavigationPanelToMenu,
		setIsNavigationPanelOpened,
	} = useDispatch( editSiteStore );

	const toggleNavigationPanel = () => {
		if ( isOpen ) {
			setIsNavigationPanelOpened( false );
			return;
		}
		openNavigationPanelToMenu( navigationPanelMenu );
	};

	let buttonIcon = <Icon size={ size } icon={ wordpress } />;

	if ( icon ) {
		buttonIcon = <Icon size={ size } icon={ icon } />;
	} else if ( siteIconUrl ) {
		buttonIcon = (
			<img
				alt={ __( 'Site Icon' ) }
				className="edit-site-navigation-toggle__site-icon"
				src={ siteIconUrl }
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	}

	const classNames = classnames( 'edit-site-navigation-toggle', {
		'is-open': isOpen,
		[ className ]: true,
	} );

	return (
		<div className={ classNames }>
			<Button
				className="edit-site-navigation-toggle__button has-icon"
				label={ label }
				onClick={ toggleNavigationPanel }
				showTooltip
			>
				{ buttonIcon }
			</Button>
		</div>
	);
}

export default NavigationToggle;
