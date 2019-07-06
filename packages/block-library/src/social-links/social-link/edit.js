/**
 * External dependencies
 */
import classnames from 'classnames';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */

import PlaceholderIcon from './PlaceholderIcon';

const SocialLinkEdit = ( { attributes, setUrl } ) => {
	return (
		<Fragment>
			<Icon icon={ PlaceholderIcon } />
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
	withDispatch( ( _, ownProps ) => {
		return {
			setUrl( url ) {
				const { setAttributes } = ownProps;

				setAttributes( { url } );
			},
		};
	} )
)( SocialLinkEdit );

