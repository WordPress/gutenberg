/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import { store as editPostStore } from '../../store';

function MetaBoxes( { location } ) {
	const { isVisible, metaBoxes } = useSelect(
		( select ) => {
			const {
				isMetaBoxLocationVisible,
				getMetaBoxesPerLocation,
			} = select( editPostStore );
			return {
				metaBoxes: getMetaBoxesPerLocation( location ),
				isVisible: isMetaBoxLocationVisible( location ),
			};
		},
		[ location ]
	);
	return (
		<>
			{ map( metaBoxes, ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			{ isVisible && <MetaBoxesArea location={ location } /> }
		</>
	);
}

export default function MetaBoxButton() {
	const [ isMetaBoxesOpen, setMetaBoxesOpen ] = useState( false );
	const openMetaBoxes = () => setMetaBoxesOpen( true );
	const closeMetaBoxes = () => setMetaBoxesOpen( false );

	const { hasActiveMetaboxes } = useSelect( ( select ) => {
		return {
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
		};
	}, [] );

	if ( ! hasActiveMetaboxes ) {
		return null;
	}

	return (
		<>
			<Button
				variant="secondary"
				onClick={ openMetaBoxes }
				aria-expanded={ isMetaBoxesOpen }
			>
				{ __( 'Open classic meta boxes' ) }
			</Button>
			{ isMetaBoxesOpen && (
				<Modal
					title={ __( 'Classic meta boxes' ) }
					onRequestClose={ closeMetaBoxes }
				>
					<MetaBoxes location="normal" />
					<MetaBoxes location="advanced" />
				</Modal>
			) }
		</>
	);
}
