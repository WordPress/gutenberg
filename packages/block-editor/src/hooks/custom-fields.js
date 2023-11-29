/**
 * Internal dependencies
 */
import { CustomFieldsControl } from '../components/custom-fields';
import { registerBlockBinding } from '../components/block-bindings';

registerBlockBinding( {
	name: 'custom-fields',
	edit: CustomFieldsControl,
} );
