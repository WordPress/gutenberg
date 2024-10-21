/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export const Save = ( { attributes } ) => {
	const blockProps = useBlockProps.save();

	return (
		<figure className="wp-block-formula" { ...blockProps }>
			<img
				src={ attributes.src }
				data-formula-source={ attributes.formulaSource }
				alt={ attributes.alt }
			/>
		</figure>
	);
};

export default Save;
