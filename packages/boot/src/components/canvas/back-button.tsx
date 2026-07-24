/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __, isRTL } from '@wordpress/i18n';

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
		<Button
			size="compact"
			onClick={ handleBack }
			label={ __( 'Go back' ) }
			icon={ isRTL() ? chevronRight : chevronLeft }
		/>
	);
}
