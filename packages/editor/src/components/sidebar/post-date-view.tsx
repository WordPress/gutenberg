import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import type { ComponentType } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { store as editorStore } from '../../store';
import type { BasePost } from '../../dataviews/types';

type PostDateViewProps = DataViewRenderFieldProps< BasePost > & {
	/**
	 * The view the `date` field renders with.
	 */
	defaultView: ComponentType< DataViewRenderFieldProps< BasePost > >;
};

const UNPUBLISHED_STATUSES = [ 'auto-draft', 'draft', 'pending' ];

const getFormattedDate = ( date: string | null ) =>
	dateI18n( getSettings().formats.datetimeAbbreviated, getDate( date ) );

/**
 * The date row of the post summary, which edits the publish date of the post.
 *
 * The `date` field words the date of unpublished and private posts as
 * "Modified:", after the posts list in wp-admin. In the summary that label is
 * wrong, so this view words the date after when the post is published, and
 * leaves the other statuses to the default view of the field.
 *
 * @param props Component props.
 * @return The rendered date.
 */
export default function PostDateView( props: PostDateViewProps ) {
	const { item, defaultView: DefaultView, ...fieldProps } = props;
	const isFloating = useSelect(
		( select ) =>
			select( editorStore ).isEditedPostDateFloating() as boolean,
		[]
	);

	if ( item.status === 'private' ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: the date a post was published on. */
				__( '<span>Published: <time>%s</time></span>' ),
				getFormattedDate( item.date ?? null )
			),
			{
				span: <span />,
				time: <time />,
			}
		);
	}

	if ( ! UNPUBLISHED_STATUSES.includes( item.status ?? '' ) ) {
		return <DefaultView item={ item } { ...fieldProps } />;
	}

	// The date of a draft or pending post floats until it is set: the post
	// takes the date it is published on.
	if ( isFloating || ! item.date ) {
		return <span>{ __( 'Publish: Immediately' ) }</span>;
	}

	return createInterpolateElement(
		sprintf(
			/* translators: %s: the date a post is set to be published on. */
			__( '<span>Publish: <time>%s</time></span>' ),
			getFormattedDate( item.date )
		),
		{
			span: <span />,
			time: <time />,
		}
	);
}
