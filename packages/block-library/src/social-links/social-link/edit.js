/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */

const SocialLinkEdit = ( { attributes, setUrl, isSelected } ) => {
	const { url } = attributes;

	const getDashiconsIconName = () => {
		const isFacebook = url.includes( 'fb.com' ) || url.includes( 'facebook.com' );

		if ( isFacebook ) {
			return 'facebook';
		}
	};

	const dashiconsIconName = getDashiconsIconName();

	return (
		<Fragment>
			<div className={ `dashicons-before dashicons-${ dashiconsIconName }` } />

			{
				isSelected && (
					<form >
						<input
							type="url"
							value={ ( attributes && url ) || '' }
							onChange={ ( event ) => setUrl( event.target.value ) }
							placeholder={ __( 'example.com/username' ) }
						/>
					</form>
				)
			}

			{ ! isSelected && url }
		</Fragment>
	);
};

export default compose(
	withDispatch( ( _, ownProps ) => {
		return {
			setUrl( url ) {
				const { setAttributes } = ownProps;

				setAttributes( { url } );
			},
		};
	} )
)( SocialLinkEdit );

