/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	Button,
	IconButton,
	PanelBody,
	Toolbar,
	Placeholder,
	RangeControl,
	ServerSideRender,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 20;

class RSSEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editing: ! this.props.attributes.feedURL,
		};

		this.toggleAttribute = this.toggleAttribute.bind( this );
		this.onSubmitURL = this.onSubmitURL.bind( this );
	}

	toggleAttribute( propName ) {
		return () => {
			const value = this.props.attributes[ propName ];
			const { setAttributes } = this.props;

			setAttributes( { [ propName ]: ! value } );
		};
	}

	onSubmitURL( event ) {
		event.preventDefault();
		this.setState( {
			editing: false,
		} );
	}

	render() {
		const {
			displayAuthor,
			displayContent,
			displayDate,
			feedURL,
			postsToShow,
		} = this.props.attributes;
		const { setAttributes } = this.props;

		if ( this.state.editing ) {
			return (
				<Placeholder
					icon="rss"
					instructions={ __( 'Paste URL to RSS feed.' ) }
					label="RSS"
				>
					<form onSubmit={ this.onSubmitURL }>
						<TextControl
							placeholder={ __( 'Enter URL here…' ) }
							value={ feedURL }
							onChange={ ( value ) => setAttributes( { feedURL: value } ) }
							className={ 'components-placeholder__input' }
						/>
						<Button
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
				</Placeholder>
			);
		}

		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit RSS URL' ) }
							onClick={ () => this.setState( { editing: true } ) }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'RSS Settings' ) }>
						<RangeControl
							label={ __( 'Number of items' ) }
							value={ postsToShow }
							onChange={ ( value ) => setAttributes( { postsToShow: value } ) }
							min={ DEFAULT_MIN_ITEMS }
							max={ DEFAULT_MAX_ITEMS }
						/>
						<ToggleControl
							label={ __( 'Display author' ) }
							checked={ displayAuthor }
							onChange={ this.toggleAttribute( 'displayAuthor' ) }
						/>
						<ToggleControl
							label={ __( 'Display content' ) }
							checked={ displayContent }
							onChange={ this.toggleAttribute( 'displayContent' ) }
						/>
						<ToggleControl
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ this.toggleAttribute( 'displayDate' ) }
						/>
					</PanelBody>
				</InspectorControls>
				<ServerSideRender
					block="core/rss"
					attributes={ this.props.attributes }
				/>
			</Fragment>
		);
	}
}

export default RSSEdit;
