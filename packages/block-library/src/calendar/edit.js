/**
 * External dependencies
 */
import moment from 'moment';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { calendar as icon } from '@wordpress/icons';
import { Disabled, Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';
import { useBlockProps } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

const getYearMonth = memoize( ( date ) => {
	if ( ! date ) {
		return {};
	}
	const momentDate = moment( date );
	return {
		year: momentDate.year(),
		month: momentDate.month() + 1,
	};
} );

export default function CalendarEdit( { attributes } ) {
	const blockProps = useBlockProps();
	const { date, hasPosts, hasPostsResolved } = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution } = select( coreStore );
		const { getEditedPostAttribute } = select( editorStore );

		const query = {
			status: 'publish',
			per_page: 1,
		};
		const posts = getEntityRecords( 'postType', 'post', query );
		const postsResolved = hasFinishedResolution( 'getEntityRecords', [
			'postType',
			'post',
			query,
		] );

		const postType = getEditedPostAttribute( 'type' );
		// Dates are used to overwrite year and month used on the calendar.
		// This overwrite should only happen for 'post' post types.
		// For other post types the calendar always displays the current month.
		const _date =
			postType === 'post' ? getEditedPostAttribute( 'date' ) : undefined;
		return {
			date: _date,
			hasPostsResolved: postsResolved,
			hasPosts:
				postsResolved && Array.isArray( posts ) && posts.length === 1,
		};
	}, [] );

	if ( ! hasPosts ) {
		return (
			<div { ...blockProps }>
				<Placeholder icon={ icon } label={ __( 'Calendar' ) }>
					{ ! hasPostsResolved ? (
						<Spinner />
					) : (
						__( 'No posts found.' )
					) }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<Disabled>
				<ServerSideRender
					block="core/calendar"
					attributes={ { ...attributes, ...getYearMonth( date ) } }
				/>
			</Disabled>
		</div>
	);
}
