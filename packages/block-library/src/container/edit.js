
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
} from '@wordpress/editor';

export default function edit() {
	return (
		<Fragment>
			<InspectorControls></InspectorControls>
			<InnerBlocks />
		</Fragment>
	);
}
