/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

function Edit( { setAttributes, attributes } ) {
	const blockProps = useBlockProps();

	const { numComments } = attributes;

	return (
		<>
			<div { ...blockProps }>
				<div>
					<input
						type="range"
						min="1"
						max="5"
						value={ numComments }
						className="slider"
						onChange={ ( e ) =>
							setAttributes( { numComments: e.target.value } )
						}
					/>
				</div>
			</div>
		</>
	);
}

export default Edit;
