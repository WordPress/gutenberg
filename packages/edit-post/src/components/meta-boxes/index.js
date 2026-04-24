/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import { store as editPostStore } from '../../store';

export default function MetaBoxes( { location } ) {
	const metaBoxes = useSelect(
		( select ) =>
			select( editPostStore ).getMetaBoxesPerLocation( location ),
		[ location ]
	);
	return (
		<>
			{ ( metaBoxes ?? [] ).map( ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			<MetaBoxesArea location={ location } />
		</>
	);
}
