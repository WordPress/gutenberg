/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
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

	const toggleNavigationPanel = () =>
		setIsNavigationPanelOpened( ! isNavigationOpen );

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	const effect = {
		expand: {
			scale: 1.25,
			transition: { type: 'tween', duration: '0.3' },
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

	const classes = classnames( {
		'edit-site-navigation-toggle__button': true,
		'has-icon': siteIconUrl,
	} );

	return (
		<motion.div
			className={
				'edit-site-navigation-toggle' +
				( isNavigationOpen ? ' is-open' : '' )
			}
			whileHover="expand"
		>
			<Button
				className={ classes }
				label={ __( 'Toggle navigation' ) }
				ref={ navigationToggleRef }
				// isPressed will add unwanted styles.
				aria-pressed={ isNavigationOpen }
				onClick={ toggleNavigationPanel }
				showTooltip
			>
				{ buttonIcon }
			</Button>
			<PinnedItems.Slot scope="core/edit-global" />
		</motion.div>
	);
}

export default NavigationToggle;
