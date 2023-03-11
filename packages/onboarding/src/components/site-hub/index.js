/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__unstableMotion as motion,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SiteIcon from '../site-icon';

const HUB_ANIMATION_DURATION = 0.3;

const SiteHub = forwardRef( ( props, ref ) => {
	const disableMotion = useReducedMotion();

	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' )?.title,
		[]
	);

	return (
		<motion.div
			ref={ ref }
			{ ...props }
			className={ classnames( 'onboarding-site-hub', props.className ) }
			layout
			transition={ {
				type: 'tween',
				duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
				ease: 'easeOut',
			} }
		>
			<HStack
				justify="flex-start"
				className="onboarding-site-hub__text-content"
				spacing="0"
			>
				<motion.div
					className="onboarding-site-hub__view-mode-toggle-container"
					layout
					transition={ {
						type: 'tween',
						duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
						ease: 'easeOut',
					} }
				>
					<SiteIcon className="onboarding-layout__view-mode-toggle-icon" />
				</motion.div>

				<div className="onboarding-site-hub__site-title">
					{ siteTitle }
				</div>
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
