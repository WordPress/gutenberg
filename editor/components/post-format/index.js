/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import PostFormatCheck from './check';
import { getEditedPostAttribute, getSuggestedPostFormat } from '../../store/selectors';
import { editPost } from '../../store/actions';

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

function PostFormat( { onUpdatePostFormat, postFormat = 'standard', suggestedFormat, instanceId } ) {
	const postFormatSelectorId = 'post-format-selector-' + instanceId;
	const suggestion = find( POST_FORMATS, ( format ) => format.id === suggestedFormat );

	// Disable reason: We need to change the value immiediately to show/hide the suggestion if needed

	/* eslint-disable jsx-a11y/no-onchange */
	return (
		<PostFormatCheck>
			<div className="editor-post-format">
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
			</div>
		</PostFormatCheck>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

export default compose( [
	connect(
		( state ) => {
			return {
				postFormat: getEditedPostAttribute( state, 'format' ),
				suggestedFormat: getSuggestedPostFormat( state ),
			};
		},
		{
			onUpdatePostFormat( postFormat ) {
				return editPost( { format: postFormat } );
			},
		},
	),
	withInstanceId,
] )( PostFormat );
