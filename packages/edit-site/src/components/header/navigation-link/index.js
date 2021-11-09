/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { useReducedMotion } from '@wordpress/compose';

function NavigationLink( { icon } ) {
	const { isRequestingSiteIcon, siteIconUrl } = useSelect( ( select ) => {
		const { getEntityRecord, isResolving } = select( coreDataStore );
		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			isRequestingSiteIcon: isResolving( 'core', 'getEntityRecord', [
				'root',
				'__unstableBase',
				undefined,
			] ),
			siteIconUrl: siteData.site_icon_url,
		};
	}, [] );

	const disableMotion = useReducedMotion();

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
				className="edit-site-navigation-link__site-icon"
				src={ siteIconUrl }
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	} else if ( icon ) {
		buttonIcon = <Icon size="36px" icon={ icon } />;
	}

	return (
		<motion.div className="edit-site-navigation-link" whileHover="expand">
			<Button
				className="edit-site-navigation-link__button has-icon"
				label={ __( 'Dashboard' ) }
				href="index.php"
			>
				{ buttonIcon }
			</Button>
		</motion.div>
	);
}

export default NavigationLink;
