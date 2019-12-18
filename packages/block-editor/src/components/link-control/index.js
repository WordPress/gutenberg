/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFunction, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ExternalLink,
	Popover,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	useState,
	useEffect,
	Fragment,
} from '@wordpress/element';

import {
	safeDecodeURI,
	filterURLForDisplay,
} from '@wordpress/url';

import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchInput from './search-input';

const MODE_EDIT = 'edit';
// const MODE_SHOW = 'show';

function LinkControl( {
	className,
	currentLink,
	currentSettings,
	instanceId,
	onClose = noop,
	onChangeMode = noop,
	onKeyDown = noop,
	onKeyPress = noop,
	onLinkChange = noop,
	onSettingsChange = noop,
} ) {
	// State
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isEditingLink, setIsEditingLink ] = useState( false );

	// Effects
	useEffect( () => {
		// If we have a link then stop editing mode
		if ( currentLink ) {
			setIsEditingLink( false );
		} else {
			setIsEditingLink( true );
		}
	}, [ currentLink ] );

	// Handlers

	/**
	 * onChange LinkControlSearchInput event handler
	 *
	 * @param {string} value Current value returned by the search.
	 */
	const onInputChange = ( value = '' ) => {
		setInputValue( value );
	};

	// Utils

	/**
	 * Handler function which switches the mode of the component,
	 * between `edit` and `show` mode.
	 * Also, it calls `onChangeMode` callback function.
	 *
	 * @param {string} mode Component mode: `show` or `edit`.
	 */
	const setMode = ( mode = 'show' ) => () => {
		setIsEditingLink( MODE_EDIT === mode );

		// Populate input searcher whether
		// the current link has a title.
		if ( currentLink && currentLink.title ) {
			setInputValue( currentLink.title );
		}

		if ( isFunction( onChangeMode ) ) {
			onChangeMode( mode );
		}
	};

	const closeLinkUI = () => {
		resetInput();
		onClose();
	};

	const resetInput = () => {
		setInputValue( '' );
	};

	return (
		<Popover
			className={ classnames( 'block-editor-link-control', className ) }
			onClose={ closeLinkUI }
			position="bottom center"
			focusOnMount="firstElement"
		>
			<div className="block-editor-link-control__popover-inner">
				<div className="block-editor-link-control__search">

					{ ( ! isEditingLink && currentLink ) && (
						<Fragment>
							<p className="screen-reader-text" id={ `current-link-label-${ instanceId }` }>
								{ __( 'Currently selected' ) }:
							</p>
							<div
								aria-labelledby={ `current-link-label-${ instanceId }` }
								aria-selected="true"
								className={ classnames( 'block-editor-link-control__search-item', {
									'is-current': true,
								} ) }
							>
								<span className="block-editor-link-control__search-item-header">

									<ExternalLink
										className="block-editor-link-control__search-item-title"
										href={ currentLink.url }
									>
										{ currentLink.title }
									</ExternalLink>
									<span className="block-editor-link-control__search-item-info">{ filterURLForDisplay( safeDecodeURI( currentLink.url ) ) || '' }</span>
								</span>

								<Button isSecondary onClick={ setMode( MODE_EDIT ) } className="block-editor-link-control__search-item-action block-editor-link-control__search-item-action--edit">
									{ __( 'Change' ) }
								</Button>
							</div>
						</Fragment>
					) }

					{ isEditingLink && (
						<LinkControlSearchInput
							value={ inputValue }
							onChange={ onInputChange }
							onSelect={ onLinkChange }
							onReset={ resetInput }
							onKeyDown={ onKeyDown }
							onKeyPress={ onKeyPress }
						/>
					) }

					{ ! isEditingLink && (
						<LinkControlSettingsDrawer settings={ currentSettings } onSettingChange={ onSettingsChange } />
					) }
				</div>
			</div>
		</Popover>
	);
}

export default compose(
	withInstanceId,
)( LinkControl );
