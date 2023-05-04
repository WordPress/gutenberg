/**
 * Internal dependencies
 */
import ReusableEdit from './reusable-edit';
import PatternEdit from './pattern-edit';

export default function SyncedBlockEdit( props ) {
	const {
		attributes: { type },
	} = props;

	if ( type === 'reusable' ) {
		return <ReusableEdit { ...props } />;
	}

	if ( type === 'pattern' ) {
		return <PatternEdit { ...props } />;
	}
}
