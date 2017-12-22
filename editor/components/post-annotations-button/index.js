/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { toggleAnnotations } from '../../store/actions';
import { isAnnotationsOpen, getAnnotations } from '../../store/selectors';

/**
 * Renders component.
 *
 * @param  {Object} props Props.
 *
 * @return {?Object} Component.
 */
function PostAnnotationsButton( { isOpen, count, onToggleAnnotations } ) {
	const onClick = () => {
		const anchor = '.editor-post-title';
		const filters = { substatus: [ '' ] };
		onToggleAnnotations( anchor, filters );
	};

	const className = classnames( 'editor-post-annotations-button', {
		'is-open': isOpen,
	} );

	return (
		<IconButton
			className={ className }
			icon="admin-comments"
			label={ __( 'All Annotations' ) }
			onClick={ onClick }
		>
			{ count > 0 && count }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isOpen: isAnnotationsOpen( state ),
		count: getAnnotations( state, { parent: 0, substatus: [ '' ] }, false ).length,
	} ),
	( dispatch ) => ( {
		onToggleAnnotations() {
			dispatch( toggleAnnotations( ...arguments ) );
		},
	} ),
)( PostAnnotationsButton );
