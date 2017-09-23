/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, find, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, withAPIData, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	getEditedPostAttribute,
	getSuggestedPostFormat,
	getCurrentPostType,
} from '../../selectors';
import { editPost } from '../../actions';

const POST_FORMATS = [
	{ id: 'aside', caption: __( 'Aside' ) },
	{ id: 'gallery', caption: __( 'Gallery' ) },
	{ id: 'link', caption: __( 'Link' ) },
	{ id: 'image', caption: __( 'Image' ) },
	{ id: 'quote', caption: __( 'Quote' ) },
	{ id: 'standard', caption: __( 'Standard' ) },
	{ id: 'status', caption: __( 'Status' ) },
	{ id: 'video', caption: __( 'Video' ) },
	{ id: 'audio', caption: __( 'Audio' ) },
	{ id: 'chat', caption: __( 'Chat' ) },
];

function PostFormat( { postType, onUpdatePostFormat, postFormat = 'standard', suggestedFormat, instanceId } ) {
	if ( ! get( postType.data, [ 'supports', 'post-formats' ] ) ) {
		return null;
	}

	const postFormatSelectorId = 'post-format-selector-' + instanceId;
	const suggestion = find( POST_FORMATS, ( format ) => format.id === suggestedFormat );

	// Disable reason: A select with an onchange throws a warning

	/* eslint-disable jsx-a11y/no-onchange */
	return (
		<PanelRow className="editor-post-format">
			<div className="editor-post-format__content">
				<label htmlFor={ postFormatSelectorId }>{ __( 'Post Format' ) }</label>
				<select
					value={ postFormat }
					onChange={ ( event ) => onUpdatePostFormat( event.target.value ) }
					id={ postFormatSelectorId }
				>
					{ POST_FORMATS.map( format => (
						<option key={ format.id } value={ format.id }>{ format.caption }</option>
					) ) }
				</select>
			</div>

			{ suggestion && suggestion.id !== postFormat && (
				<div className="editor-post-format__suggestion">
					{ __( 'Suggestion:' ) }{ ' ' }
					<button className="button-link" onClick={ () => onUpdatePostFormat( suggestion.id ) }>
						{ suggestion.caption }
					</button>
				</div>
			) }
		</PanelRow>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

export default flowRight( [
	connect(
		( state ) => {
			return {
				postFormat: getEditedPostAttribute( state, 'format' ),
				suggestedFormat: getSuggestedPostFormat( state ),
				postTypeSlug: getCurrentPostType( state ),
			};
		},
		{
			onUpdatePostFormat( postFormat ) {
				return editPost( { format: postFormat } );
			},
		},
	),
	withAPIData( ( props ) => {
		const { postTypeSlug } = props;

		return {
			postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
		};
	} ),
	withInstanceId,
] )( PostFormat );
