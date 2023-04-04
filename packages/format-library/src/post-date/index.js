/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	useBlockContext,
	useBlockEditContext,
} from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { useEntityProp } from '@wordpress/core-data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';

const name = 'core/post-date';
const title = __( 'Post Date' );

export const postDate = {
	name,
	title,
	tagName: 'data',
	render: function Render() {
		const displayType = 'date';
		const format = '';
		const { clientId } = useBlockEditContext;
		const { postId, postType: postTypeSlug } = useBlockContext( clientId );
		const [ date ] = useEntityProp(
			'postType',
			postTypeSlug,
			displayType,
			postId
		);
		const dateSettings = getDateSettings();
		const [ siteFormat = dateSettings.formats.date ] = useEntityProp(
			'root',
			'site',
			'date_format'
		);
		const dateLabel =
			displayType === 'date'
				? __( 'Post Date' )
				: __( 'Post Modified Date' );

		return date ? (
			<time dateTime={ dateI18n( 'c', date ) }>
				{ dateI18n( format || siteFormat, date ) }
			</time>
		) : (
			dateLabel
		);
	},
	edit( { isObjectActive, value, onChange, onFocus } ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
			</>
		);
	},
};
