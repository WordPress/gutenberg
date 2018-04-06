/**
 * Defines extensibility slot for post-publish sidebar.
 *
 * Defines slot to be used by plugins to insert content in the post-publish sidebar
 * (which appears after a user fully publishes a post).
 *
 * @file   This files defines the PluginPostPublishPanel extension
 * @since  2.7.0
 */

/**
 * Internal dependencies
 */
import { createSlotFill } from '../../../components/slot-fill';

export default createSlotFill( 'PluginPostPublishPanel' );
