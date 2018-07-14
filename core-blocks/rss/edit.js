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
const DEFAULT_MAX_ITEMS = 10;

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
			columns,
			displayAuthor,
			displayExcerpt,
			displayDate,
			excerptLength,
			feedURL,
			postLayout,
			postsToShow,
		} = this.props.attributes;
		const { setAttributes } = this.props;

		if ( this.state.editing ) {
			return (
				<Placeholder
					icon="rss"
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

		const layoutControls = [
			{
				icon: 'list-view',
				title: __( 'List View' ),
				onClick: () => setAttributes( { postLayout: 'list' } ),
				isActive: postLayout === 'list',
			},
			{
				icon: 'grid-view',
				title: __( 'Grid View' ),
				onClick: () => setAttributes( { postLayout: 'grid' } ),
				isActive: postLayout === 'grid',
			},
		];

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
					<Toolbar controls={ layoutControls } />
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
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ this.toggleAttribute( 'displayDate' ) }
						/>
						<ToggleControl
							label={ __( 'Display excerpt' ) }
							checked={ displayExcerpt }
							onChange={ this.toggleAttribute( 'displayExcerpt' ) }
						/>
						{ displayExcerpt &&
							<RangeControl
								label={ __( 'Max length of the excerpt' ) }
								value={ excerptLength }
								onChange={ ( value ) => setAttributes( { excerptLength: value } ) }
								min={ 0 }
								max={ 100 }
								step={ 5 }
							/>
						}
						{ postLayout === 'grid' &&
							<RangeControl
								label={ __( 'Columns' ) }
								value={ columns }
								onChange={ ( value ) => setAttributes( { columns: value } ) }
								min={ 2 }
								max={ 6 }
							/>
						}
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
