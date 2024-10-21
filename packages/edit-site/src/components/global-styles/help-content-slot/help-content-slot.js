/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { warning } from '@wordpress/warning';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';

// Create Slot and Fill for Help Content
const { Fill, Slot } = createSlotFill( 'HelpContentSlot' );

/**
 * Check if the given value is a function.
 *
 * @param {*} maybeFunc - Value to check.
 * @return {boolean} - True if it's a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

/**
 * Fill component for HelpContentSlot.
 */
const HelpContentFill = ( { renderContent = null } ) => {
	// Ensure renderContent is provided and is a function.
	if ( ! renderContent || ! isFunction( renderContent ) ) {
		warning( 'HelpContentSlot requires a valid renderContent function.' );
		return null;
	}

	return <Fill>{ renderContent() }</Fill>;
};

// Enhance the Fill component with plugin context if needed.
const HelpContentSlot = compose(
	withPluginContext( ( context, ownProps ) => ( {
		...ownProps,
	} ) )
)( HelpContentFill );

// Expose Slot for usage in other components.
HelpContentSlot.Slot = Slot;

export default HelpContentSlot;
