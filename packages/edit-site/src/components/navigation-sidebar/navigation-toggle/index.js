/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

function NavigationToggle( { icon, isOpen } ) {
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

	const disableMotion = useReducedMotion();

	const toggleNavigationPanel = () => {
		if ( isOpen ) {
			setIsNavigationPanelOpened( false );
			return;
		}
		openNavigationPanelToMenu( navigationPanelMenu );
	};

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	const effect = {
		expand: {
			scale: 1.7,
			borderRadius: 0,
			transition: { type: 'tween', duration: '0.2' },
		},
	};

	if ( siteIconUrl ) {
		buttonIcon = (
			<motion.img
				variants={ ! disableMotion && effect }
				alt={ __( 'Site Icon' ) }
				className="edit-site-navigation-toggle__site-icon"
				src={ siteIconUrl }
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	} else if ( icon ) {
		buttonIcon = <Icon size="36px" icon={ icon } />;
	}

	return (
		<motion.div
			className={
				'edit-site-navigation-toggle' + ( isOpen ? ' is-open' : '' )
			}
			whileHover="expand"
		>
			<Button
				className="edit-site-navigation-toggle__button has-icon"
				label={ __( 'Toggle navigation' ) }
				onClick={ toggleNavigationPanel }
				showTooltip
			>
				{ buttonIcon }
			</Button>
		</motion.div>
	);
}

export default NavigationToggle;
