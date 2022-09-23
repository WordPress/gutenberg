/**
 * Internal dependencies
 */
import ExternalImagesList from './image-list';
import { useImageResults } from './hooks';

export default function ImageResults( {
	search,
	pageSize = 10,
	rootClientId,
	onClick,
} ) {
	const results = useImageResults( { search, pageSize } );
	if ( ! results?.length ) {
		return null;
	}
	return (
		<ExternalImagesList
			results={ results }
			rootClientId={ rootClientId }
			onClick={ onClick }
		/>
	);
}
