/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

function NavigationToggle( { isOpen } ) {
	const { navigationPanelMenu } = useSelect( ( select ) => {
		const { getCurrentTemplateNavigationPanelSubMenu } = select(
			editSiteStore
		);

		return {
			navigationPanelMenu: getCurrentTemplateNavigationPanelSubMenu(),
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

	const classNames = classnames( 'edit-site-navigation-toggle', {
		'is-open': isOpen,
	} );

	return (
		<div className={ classNames }>
			<Button
				className="edit-site-navigation-toggle__button"
				icon={ closeSmall }
				label={ __( 'Toggle navigation sidebar' ) }
				onClick={ toggleNavigationPanel }
			/>
		</div>
	);
}

export default NavigationToggle;
