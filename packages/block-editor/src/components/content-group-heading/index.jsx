import clsx from 'clsx';
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { unlock } from '../../lock-unlock';

function ContentGroupName( { clientId } ) {
	return useBlockDisplayTitle( { clientId, context: 'list-view' } );
}

/**
 * Renders the heading that introduces the content rows of a named group inside
 * a content-only pattern, or nothing when the row it precedes is not the first
 * of its group.
 *
 * Groups nest, so the heading reads as a path from the outermost named
 * container inwards. That is what tells two identically named cards apart when
 * they sit under different parents.
 *
 * @param {Object}  props           Component props.
 * @param {string}  props.clientId  Client ID of the content block the heading precedes.
 * @param {?string} props.className Additional class name, e.g. to match the inset of the list it heads.
 */
export default function ContentGroupHeading( { clientId, className } ) {
	const groupClientIds = useSelect(
		( select ) =>
			unlock(
				select( blockEditorStore )
			).getContentGroupHeadingClientIds( clientId ),
		[ clientId ]
	);

	if ( ! groupClientIds.length ) {
		return null;
	}

	return (
		<h2
			className={ clsx(
				'block-editor-content-group-heading',
				className
			) }
		>
			{ groupClientIds.map( ( groupClientId, index ) => (
				<Fragment key={ groupClientId }>
					{ index > 0 && (
						<span
							className="block-editor-content-group-heading__separator"
							aria-hidden="true"
						>
							/
						</span>
					) }
					<ContentGroupName clientId={ groupClientId } />
				</Fragment>
			) ) }
		</h2>
	);
}
