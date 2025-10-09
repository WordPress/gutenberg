/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Modal,
	Notice,
	RangeControl,
	TextareaControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { bolt } from './../../icons/bolt';
import { parseIcon } from './../../utils';

export default function CustomInserterModal( props ) {
	const {
		isCustomInserterOpen,
		setCustomInserterOpen,
		attributes,
		setAttributes,
	} = props;
	const { icon, iconName } = attributes;
	const [ customIcon, setCustomIcon ] = useState( ! iconName ? icon : '' );
	const [ iconSize, setIconSize ] = useState( 100 );

	// Reset values when modal is closed.
	useEffect( () => {
		if ( ! isCustomInserterOpen ) {
			setIconSize( 100 );
		}
	}, [ isCustomInserterOpen ] );

	// If a SVG icon is inserted from the Media Library, we need to update
	// the custom icon editor in the modal.
	useEffect( () => setCustomIcon( icon ), [ icon ] );

	if ( ! isCustomInserterOpen ) {
		return null;
	}

	const insertCustomIcon = () => {
		setAttributes( {
			icon: customIcon,
			iconName: '',
		} );
		setCustomInserterOpen( false );
	};

	const closeModal = () => {
		setCustomInserterOpen( false );
	};

	let iconToRender = parseIcon( customIcon );
	const isSVG =
		iconToRender?.props && Object.keys( iconToRender.props ).length > 0;

	// Render the default lightning bolt if the icon is not a valid SVG.
	iconToRender = isSVG ? iconToRender : bolt;

	return (
		<Modal
			className="wp-block-outermost-icon-custom-inserter__modal"
			title={ __( 'Custom Icon' ) }
			onRequestClose={ closeModal }
			isFullScreen
		>
			<div className="icon-custom-inserter">
				<div className="icon-custom-inserter__content">
					<TextareaControl
						label={ __( 'Custom icon' ) }
						hideLabelFromVision
						value={ customIcon }
						onChange={ setCustomIcon }
						placeholder={ __(
							'Paste the SVG code for your custom icon.'
						) }
						__nextHasNoMarginBottom
					/>
				</div>
				<div className="icon-custom-inserter__sidebar">
					<IconPreview
						iconToRender={ isSVG ? iconToRender : bolt }
						iconSize={ iconSize }
						setIconSize={ setIconSize }
						isSVG={ isSVG }
					/>
					{ customIcon && ! isSVG && (
						<Notice status="error" isDismissible={ false }>
							{ __(
								'The custom icon does not appear to be in a valid SVG format or contains non-SVG elements.'
							) }
						</Notice>
					) }
					<IconInsertButtons
						customIcon={ customIcon }
						isSVG={ isSVG }
						onClear={ () => setCustomIcon( '' ) }
						onInsert={ insertCustomIcon }
					/>
				</div>
			</div>
		</Modal>
	);
}

function IconPreview( { iconToRender, iconSize, setIconSize, isSVG } ) {
	return (
		<div className="icon-preview">
			<div
				className={ clsx( 'icon-preview__window', {
					'is-default': ! isSVG,
				} ) }
			>
				<Icon icon={ iconToRender } size={ iconSize } />
			</div>
			<div className="icon-controls">
				<div className="icon-controls__size">
					<span>{ __( 'Preview size' ) }</span>
					<RangeControl
						min={ 24 }
						max={ 400 }
						value={ iconSize }
						onChange={ setIconSize }
						withInputField={ false }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</div>
			</div>
		</div>
	);
}

function IconInsertButtons( { customIcon, isSVG, onClear, onInsert } ) {
	return (
		<div className="icon-insert-buttons">
			<Button
				label={ __( 'Clear custom icon' ) }
				variant="secondary"
				// eslint-disable-next-line no-restricted-syntax
				disabled={ ! customIcon }
				onClick={ onClear }
				__next40pxDefaultSize
			>
				{ __( 'Clear' ) }
			</Button>
			<Button
				label={ __( 'Insert custom icon' ) }
				variant="primary"
				accessibleWhenDisabled
				disabled={ ! isSVG || ! customIcon }
				onClick={ onInsert }
				__next40pxDefaultSize
			>
				{ __( 'Insert custom icon' ) }
			</Button>
		</div>
	);
}
