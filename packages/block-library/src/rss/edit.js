/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Button,
	Disabled,
	PanelBody,
	Placeholder,
	RangeControl,
	TextControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

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

		const { feedURL } = this.props.attributes;
		if ( feedURL ) {
			this.setState( { editing: false } );
		}
	}

	render() {
		const {
			blockLayout,
			columns,
			displayAuthor,
			displayExcerpt,
			displayDate,
			excerptLength,
			feedURL,
			itemsToShow,
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
						<Button isSecondary type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
				</Placeholder>
			);
		}

		const toolbarControls = [
			{
				icon: 'edit',
				title: __( 'Edit RSS URL' ),
				onClick: () => this.setState( { editing: true } ),
			},
			{
				icon: 'list-view',
				title: __( 'List view' ),
				onClick: () => setAttributes( { blockLayout: 'list' } ),
				isActive: blockLayout === 'list',
			},
			{
				icon: 'grid-view',
				title: __( 'Grid view' ),
				onClick: () => setAttributes( { blockLayout: 'grid' } ),
				isActive: blockLayout === 'grid',
			},
		];

		return (
			<>
				<BlockControls>
					<ToolbarGroup controls={ toolbarControls } />
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'RSS Settings' ) }>
						<RangeControl
							label={ __( 'Number of items' ) }
							value={ itemsToShow }
							onChange={ ( value ) => setAttributes( { itemsToShow: value } ) }
							min={ DEFAULT_MIN_ITEMS }
							max={ DEFAULT_MAX_ITEMS }
							required
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
								label={ __( 'Max number of words in excerpt' ) }
								value={ excerptLength }
								onChange={ ( value ) => setAttributes( { excerptLength: value } ) }
								min={ 10 }
								max={ 100 }
								required
							/>
						}
						{ blockLayout === 'grid' &&
							<RangeControl
								label={ __( 'Columns' ) }
								value={ columns }
								onChange={ ( value ) => setAttributes( { columns: value } ) }
								min={ 2 }
								max={ 6 }
								required
							/>
						}
					</PanelBody>
				</InspectorControls>
				<Disabled>
					<ServerSideRender
						block="core/rss"
						attributes={ this.props.attributes }
					/>
				</Disabled>
			</>
		);
	}
}

export default RSSEdit;
