/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Constants
 */
const ALLOWED_BLOCKS = [ 'core/code' ];

const TEMPLATE = [ [ 'core/code', { placeholder: 'Add URL...' } ] ];

const SocialLinkEdit = ( { attributes } ) => {
	return (
		<Fragment>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ TEMPLATE }
				templateInsertUpdatesSelection={ false }
			/>
		</Fragment>
	);
};

export default SocialLinkEdit;

