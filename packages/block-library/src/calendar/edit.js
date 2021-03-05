/**
 * External dependencies
 */
import moment from 'moment';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';
import { useBlockProps } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

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
	const date = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );

		const postType = getEditedPostAttribute( 'type' );
		// Dates are used to overwrite year and month used on the calendar.
		// This overwrite should only happen for 'post' post types.
		// For other post types the calendar always displays the current month.
		return postType === 'post'
			? getEditedPostAttribute( 'date' )
			: undefined;
	}, [] );

	return (
		<div { ...useBlockProps() }>
			<Disabled>
				<ServerSideRender
					block="core/calendar"
					attributes={ { ...attributes, ...getYearMonth( date ) } }
				/>
			</Disabled>
		</div>
	);
}
