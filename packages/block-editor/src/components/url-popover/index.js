/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	ExternalLink,
	IconButton,
	Popover,
} from '@wordpress/components';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import URLInput from '../url-input';

class URLPopover extends Component {
	constructor() {
		super( ...arguments );

		this.toggleSettingsVisibility = this.toggleSettingsVisibility.bind( this );

		this.state = {
			isSettingsExpanded: false,
		};
	}

	toggleSettingsVisibility() {
		this.setState( {
			isSettingsExpanded: ! this.state.isSettingsExpanded,
		} );
	}

	render() {
		const {
			additionalControls,
			children,
			renderSettings,
			position = 'bottom center',
			focusOnMount = 'firstElement',
			...popoverProps
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = !! renderSettings && isSettingsExpanded;

		return (
			<Popover
				className="editor-url-popover block-editor-url-popover"
				focusOnMount={ focusOnMount }
				position={ position }
				{ ...popoverProps }
			>
				<div className="block-editor-url-popover__input-container">
					<div className="editor-url-popover__row block-editor-url-popover__row">
						{ children }
						{ !! renderSettings && (
							<IconButton
								className="editor-url-popover__settings-toggle block-editor-url-popover__settings-toggle"
								icon="arrow-down-alt2"
								label={ __( 'Link Settings' ) }
								onClick={ this.toggleSettingsVisibility }
								aria-expanded={ isSettingsExpanded }
							/>
						) }
					</div>
					{ showSettings && (
						<div className="editor-url-popover__row block-editor-url-popover__row editor-url-popover__settings block-editor-url-popover__settings">
							{ renderSettings() }
						</div>
					) }
				</div>
				{ additionalControls && ! showSettings && (
					<div
						className="block-editor-url-popover__additional-controls"
					>
						{ additionalControls }
					</div>
				) }
			</Popover>
		);
	}
}

const LinkEditor = ( {
	autocompleteRef,
	className,
	onChangeInputValue,
	value,
	...props
} ) => (
	<form
		className={ classnames(
			'block-editor-url-popover__link-editor',
			className
		) }
		{ ...props }
	>
		<URLInput
			value={ value }
			onChange={ onChangeInputValue }
			autocompleteRef={ autocompleteRef }
		/>
		<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />

	</form>
);

URLPopover.__experimentalLinkEditor = LinkEditor;

const LinkViewerUrl = ( { url, urlLabel, className } ) => {
	const linkClassName = classnames(
		className,
		'block-editor-url-popover__link-viewer-url'
	);

	if ( ! url ) {
		return <span className={ linkClassName }></span>;
	}

	return (
		<ExternalLink
			className={ linkClassName }
			href={ url }
		>
			{ urlLabel || filterURLForDisplay( safeDecodeURI( url ) ) }
		</ExternalLink>
	);
};

const LinkViewer = ( {
	className,
	url,
	urlLabel,
	editLink,
	linkClassName,
	...props
} ) => {
	return (
		<div
			className={ classnames(
				'block-editor-url-popover__link-viewer',
				className
			) }
			{ ...props }
		>
			<LinkViewerUrl url={ url } urlLabel={ urlLabel } className={ linkClassName } />
			<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ editLink } />
		</div>
	);
};

URLPopover.__experimentalLinkViewer = LinkViewer;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/url-popover/README.md
 */
export default URLPopover;
