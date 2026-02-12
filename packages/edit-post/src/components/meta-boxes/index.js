/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import MetaBoxCollaborationWarning from './meta-box-collaboration-warning';
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
				<Fragment key={ id }>
					<MetaBoxVisibility id={ id } />
					<MetaBoxCollaborationWarning id={ id } />
				</Fragment>
			) ) }
			<MetaBoxesArea location={ location } />
		</>
	);
}
