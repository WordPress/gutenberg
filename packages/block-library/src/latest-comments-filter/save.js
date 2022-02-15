/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

function Edit( { attributes } ) {
	const { numComments } = attributes;

	return (
		<>
			<div { ...useBlockProps.save() }>
				<div>
					<input
						type="range"
						min="1"
						max="5"
						value={ numComments }
						className="slider"
					/>
				</div>
			</div>
		</>
	);
}

export default Edit;
