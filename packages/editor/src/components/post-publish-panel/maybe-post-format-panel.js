/**
 * External dependencies
 */
import { find, get, includes, union } from 'lodash';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { ifCondition, compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Button, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { POST_FORMATS } from '../post-format';

const PostFormatSuggested = ( { suggestion, onUpdatePostFormat } ) => <Button isLink onClick={ () => onUpdatePostFormat( suggestion.id ) }>
	{ suggestion.caption }
</Button>;

const PostFormatPanel = ( { suggestion, onUpdatePostFormat } ) => <PanelBody initialOpen={ false } title={ [
	__( 'Tip:' ),
	<span className="editor-post-publish-panel__link" key="label">{
		__( 'Add a post format' )
	}</span>,
] } >
	<p> { __( 'Your theme uses post formats -- styling tweaks that complement different kinds of content.' ) } </p>
	<p>
		{ __( 'The ' ) }
		<PostFormatSuggested suggestion={ suggestion } onUpdatePostFormat={ onUpdatePostFormat } />
		{ __( ' format would be great for this post.' ) }
	</p>
</PanelBody>;

export default compose(
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getSuggestedPostFormat } = select( 'core/editor' );
		const suggestedPostFormat = getSuggestedPostFormat();
		const currentPostFormat = getEditedPostAttribute( 'format' );
		const themeSupports = select( 'core' ).getThemeSupports();
		// Ensure current format is always in the set.
		// The current format may not be a format supported by the theme.
		const supportedFormats = union( [ currentPostFormat ], get( themeSupports, [ 'formats' ], [] ) );
		const formats = POST_FORMATS.filter( ( format ) => includes( supportedFormats, format.id ) );
		const suggestion = find( formats, ( format ) => format.id === suggestedPostFormat );
		return {
			currentPostFormat,
			suggestedPostFormat,
			suggestion,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdatePostFormat( postFormat ) {
			dispatch( 'core/editor' ).editPost( { format: postFormat } );
		},
	} ) ),
	ifCondition( ( { suggestedPostFormat, currentPostFormat } ) => suggestedPostFormat && suggestedPostFormat !== currentPostFormat ),
)( PostFormatPanel );
