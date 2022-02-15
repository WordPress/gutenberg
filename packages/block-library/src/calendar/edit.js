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
import { __experimentalUseEntityRecords as useEntityRecords } from '@wordpress/core-data';
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
	const { records: posts, hasResolved: hasPostsResolved } = useEntityRecords(
		'postType',
		'post',
		{
			status: 'publish',
			per_page: 1,
		}
	);
	const hasPosts = hasPostsResolved && posts?.length === 1;
	const date = useSelect( ( select ) => {
		let _date;
		// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editorSelectors = select( 'core/editor' );
		if ( editorSelectors ) {
			const postType = editorSelectors.getEditedPostAttribute( 'type' );
			// Dates are used to overwrite year and month used on the calendar.
			// This overwrite should only happen for 'post' post types.
			// For other post types the calendar always displays the current month.
			if ( postType === 'post' ) {
				_date = editorSelectors.getEditedPostAttribute( 'date' );
			}
		}

		return _date;
	}, [] );

	if ( ! hasPosts ) {
		return (
			<div { ...blockProps }>
				<Placeholder icon={ icon } label={ __( 'Calendar' ) }>
					{ ! hasPostsResolved ? (
						<Spinner />
					) : (
						__( 'No published posts found.' )
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
