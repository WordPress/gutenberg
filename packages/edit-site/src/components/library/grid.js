/**
 * Internal dependencies
 */
import usePatterns from './use-patterns';

export default function Grid() {
	const patterns = usePatterns();

	return (
		<div className="edit-site-library__grid">
			{ patterns.map( () => '' ) }
		</div>
	);
}
