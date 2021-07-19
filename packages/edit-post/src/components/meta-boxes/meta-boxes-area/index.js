/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const MetaBoxesArea = ( { location } ) => {
	const container = useRef( null );
	const [ form, setForm ] = useState( null );

	useEffect( () => {
		setForm( document.querySelector( '.metabox-location-' + location ) );

		if ( form ) {
			container.current.appendChild( form );
		}

		return () => {
			if ( form ) {
				document.querySelector( '#metaboxes' ).appendChild( form );
			}
		};
	}, [ form, location ] );

	const isSaving = useSelect( ( select ) => {
		return select( editPostStore ).isSavingMetaBoxes();
	}, [] );

	const classes = classnames(
		'edit-post-meta-boxes-area',
		`is-${ location }`,
		{
			'is-loading': isSaving,
		}
	);

	return (
		<div className={ classes }>
			{ isSaving && <Spinner /> }
			<div
				className="edit-post-meta-boxes-area__container"
				ref={ container }
			/>
			<div className="edit-post-meta-boxes-area__clear" />
		</div>
	);
};

export default MetaBoxesArea;
