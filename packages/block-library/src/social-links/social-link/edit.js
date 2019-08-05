/**
 * WordPress dependencies
 */
import { URLInput } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

const SocialLinkEdit = ( { attributes, setAttributes, className, isSelected } ) => {
	const { icon, url } = attributes;

	return (
		<>
			<span className={ className }>
				{ icon } Icon
			</span>
			{
				isSelected && (
					<URLInput
						value={ url }
						onChange={ ( value ) => setAttributes( { url: value } ) }
					/>
				)
			}
		</>
	);
};

export default SocialLinkEdit;
