/**
 * External dependencies
 */
import { capitalize } from 'lodash';
import cx from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { Icon } from '@wordpress/components';

function detectOverlap( e1, e2 ) {
	const rect1 = e1 && e1.getBoundingClientRect();
	const rect2 = e2 && e2.getBoundingClientRect();

	let overlap = null;
	if ( rect1 && rect2 ) {
		overlap = ! (
			rect1.right < rect2.left ||
			rect1.left > rect2.right ||
			rect1.bottom < rect2.top ||
			rect1.top > rect2.bottom
		);
		return overlap;
	}

	return false;
}

export default function TemplatePartLabel( { postId, slug } ) {
	const [ title ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);

	const { toolbarId } = useSelect( ( select ) => {
		const { getToolbarId } = select( 'core/block-editor' );
		return { toolbarId: getToolbarId() };
	} );

	const labelElement = useRef( null );
	const [ toolbarElement, setToolbarElement ] = useState( null );

	useEffect( () => {
		const toolbar = document.getElementById( toolbarId );
		setToolbarElement( toolbar );
	}, [ toolbarId ] );

	const isOverlapped = detectOverlap( labelElement.current, toolbarElement );
	const label = capitalize( title || slug );

	return (
		<div
			className={ cx( 'wp-block-template-part__label-container', {
				overlapped: isOverlapped,
			} ) }
		>
			<div className="wp-block-template-part__label-layout">
				<div
					ref={ labelElement }
					className="wp-block-template-part__label-content"
				>
					<Icon icon="block-default" size={ 13 } />
					<span className="wp-block-template-part__label-text">
						{ label }
					</span>
				</div>
			</div>
		</div>
	);
}
