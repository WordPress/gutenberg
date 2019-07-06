/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

const SocialLinkEdit = ( { attributes, setUrl } ) => {
	return (
		<Fragment>
			<form >
				<input
					type="url"
					value={ ( attributes && attributes.url ) || '' }
					onChange={ ( event ) => setUrl( event.target.value ) }
					placeholder={ __( 'example.com/username' ) }
				/>
			</form>
		</Fragment>
	);
};

export default compose(
	withDispatch( ( ownProps ) => {
		return {
			setUrl( url ) {
				const { setAttributes } = ownProps;

				setAttributes( { url } );
			},
		};
	} )
)( SocialLinkEdit );

