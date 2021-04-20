/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store/index';

function NavigationClose( { isOpen } ) {
	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	const closeNavigationPanel = () => {
		if ( isOpen ) {
			setIsNavigationPanelOpened( false );
		}
	};

	const classNames = classnames( 'edit-site-navigation-close', {
		'is-open': isOpen,
	} );

	return (
		<div className={ classNames }>
			<Button
				className="edit-site-navigation-close__button"
				icon={ closeSmall }
				label={ __( 'Close Navigation Sidebar' ) }
				onClick={ closeNavigationPanel }
			/>
		</div>
	);
}

export default NavigationClose;
