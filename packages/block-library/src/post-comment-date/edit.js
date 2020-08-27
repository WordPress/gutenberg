/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';

export default function Edit( { attributes, context } ) {
	const { className } = attributes;
	const { commentId } = context;

	const [ siteDateFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ date ] = useEntityProp( 'root', 'comment', 'date', commentId );

	return (
		<div className={ className }>
			<time dateTime={ dateI18n( 'c', date ) }>
				{ dateI18n( siteDateFormat, date ) }
			</time>
		</div>
	);
}
