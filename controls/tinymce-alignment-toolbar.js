import AlignmentToolbar from './alignment-toolbar';

const command = ( name ) => () => {
	tinymce.execCommand( name );
};

const TinyMCEAlignmentToolbar = ( props ) => (
	<AlignmentToolbar { ...props } actions={ {
		left: command( 'JustifyLeft' ),
		center: command( 'JustifyCenter' ),
		right: command( 'JustifyRight' ),
	} } />
);

export default TinyMCEAlignmentToolbar;
