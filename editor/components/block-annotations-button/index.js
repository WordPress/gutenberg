/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Renders component.
 *
 * @param  {Object} props Props.
 *
 * @return {?Object} Element.
 */
function BlockAnnotationsButton( { uids, count, onClick } ) {
	const className = classnames( 'editor-block-annotations-button', {
		'is-count-gt0': count > 0,
	} );

	return (
		<IconButton
			className={ className }
			label={ __( 'Annotations' ) }
			icon="admin-comments"
			data-uids={ uids }
			onClick={ onClick }
			tooltip={ false }
		>
			{ count > 0 && count }
		</IconButton>
	);
}

export default BlockAnnotationsButton;
