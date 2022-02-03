/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation, wordpress } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { useReducedMotion } from '@wordpress/compose';
import { PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

function NavigationToggle( { icon } ) {
	const { isNavigationOpen, isRequestingSiteIcon, siteIconUrl } = useSelect(
		( select ) => {
			const { getEntityRecord, isResolving } = select( coreDataStore );
			const siteData =
				getEntityRecord( 'root', '__unstableBase', undefined ) || {};

			return {
				isNavigationOpen: select( editSiteStore ).isNavigationOpened(),
				isRequestingSiteIcon: isResolving( 'core', 'getEntityRecord', [
					'root',
					'__unstableBase',
					undefined,
				] ),
				siteIconUrl: siteData.site_icon_url,
			};
		},
		[]
	);
	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	const disableMotion = useReducedMotion();

	const navigationToggleRef = useRef();

	useEffect( () => {
		// TODO: Remove this effect when alternative solution is merged.
		// See: https://github.com/WordPress/gutenberg/pull/37314
		if ( ! isNavigationOpen ) {
			navigationToggleRef.current.focus();
		}
	}, [ isNavigationOpen ] );

	const toggleNavigationPanel = () =>
		setIsNavigationPanelOpened( ! isNavigationOpen );

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
				'edit-site-navigation-toggle' +
				( isNavigationOpen ? ' is-open' : '' )
			}
			whileHover="expand"
		>
			<Button
				className="edit-site-navigation-toggle__button has-icon"
				label={ __( 'Toggle navigation' ) }
				ref={ navigationToggleRef }
				// isPressed will add unwanted styles.
				aria-pressed={ isNavigationOpen }
				onClick={ toggleNavigationPanel }
				showTooltip
			>
				{ buttonIcon }
			</Button>
			<Button icon={ navigation } iconSize={ 24 } />
			<PinnedItems.Slot scope="core/edit-site" />
		</motion.div>
	);
}

export default NavigationToggle;
