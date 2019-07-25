// TODO: Unit tests.

/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import getRawValue from './get-raw-value';

/**
 * Given an entity object, returns an equivalent object with all property values
 * assigned in their raw form.
 *
 * @param {Object} object Entity object.
 *
 * @return {Object} Object with raw property values.
 */
const flattenRawProperties = ( object ) => mapValues( object, getRawValue );

export default flattenRawProperties;
