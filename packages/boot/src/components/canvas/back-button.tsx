/**
 * WordPress dependencies
 */
import { Button, Icon as WCIcon } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __, isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './back-button.scss';

/**
 * Back button component that appears in full-screen canvas mode.
 *
 * @param {Object} props        Component props
 * @param {number} props.length Number of BackButton fills (from Slot)
 * @return Back button
 */
export default function BootBackButton( { length }: { length: number } ) {
	const handleBack = () => {
		window.history.back();
	};

	// Only render if this is the only back button
	if ( length > 1 ) {
		return null;
	}

	return (
		<div className="boot-canvas-back-button">
			<Button
				className="boot-canvas-back-button__link"
				onClick={ handleBack }
				aria-label={ __( 'Go back' ) }
				__next40pxDefaultSize
			/>
			<div className="boot-canvas-back-button__icon">
				<WCIcon icon={ isRTL() ? chevronRight : chevronLeft } />
			</div>
		</div>
	);
}
