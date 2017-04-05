import AlignmentToolbar from './alignment-toolbar';

const TinyMCEAlignmentToolbar = ( props ) => (
	<AlignmentToolbar { ...props } actions={ {
		left: () => tinymce.execCommand( 'JustifyLeft' ),
		center: () => tinymce.execCommand( 'JustifyCenter' ),
		right: () => tinymce.execCommand( 'JustifyRight' ),
	} } />
);

export default TinyMCEAlignmentToolbar;
