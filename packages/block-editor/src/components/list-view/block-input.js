/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	__experimentalInputControl as InputControl,
	VisuallyHidden,
} from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import { ENTER, ESCAPE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import ListViewExpander from './expander';

const ListViewBlockInput = forwardRef(
	(
		{
			className,
			onToggleExpanded,
			toggleLabelEditingMode,
			blockInformation,
			isLocked,
			blockTitle,
			onSubmit,
		},
		ref
	) => {
		const inputRef = useFocusOnMount();
		const inputDescriptionId = useInstanceId(
			ListViewBlockInput,
			`block-editor-list-view-block-node__input-description`
		);

		// Local state for value of input **pre-submission**.
		const [ inputValue, setInputValue ] = useState( blockTitle );

		const onKeyDownHandler = ( event ) => {
			// Trap events to input when editing to avoid
			// default list view key handing (e.g. arrow
			// keys for navigation).
			event.stopPropagation();

			// Handle ENTER and ESC exits editing mode.
			if ( event.keyCode === ENTER || event.keyCode === ESCAPE ) {
				if ( event.keyCode === ESCAPE ) {
					// Must be assertive to immediately announce change.
					speak( 'Leaving edit mode', 'assertive' );
				}

				if ( event.keyCode === ENTER ) {
					// Submit changes only for ENTER.
					onSubmit( inputValue );
					const successAnnouncement = sprintf(
						/* translators: %s: new name/label for the block */
						__( 'Block name updated to: "%s".' ),
						inputValue
					);
					// Must be assertive to immediately announce change.
					speak( successAnnouncement, 'assertive' );
				}

				toggleLabelEditingMode( false );
			}
		};

		return (
			<div
				ref={ ref }
				className={ classnames(
					'block-editor-list-view-block-node',
					'block-editor-list-view-block-input',
					className
				) }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon icon={ blockInformation?.icon } showColors />
				<HStack
					alignment="center"
					className="block-editor-list-view-block-node__label-wrapper"
					justify="flex-start"
					spacing={ 1 }
				>
					<span className="block-editor-list-view-block-node__title">
						<InputControl
							ref={ inputRef }
							value={ inputValue }
							label={ __( 'Edit block name' ) }
							hideLabelFromVision
							onChange={ ( nextValue ) => {
								setInputValue( nextValue ?? '' );
							} }
							onBlur={ () => {
								toggleLabelEditingMode( false );

								// Reset the input's local state to avoid
								// stale values.
								setInputValue( blockTitle );
							} }
							onKeyDown={ onKeyDownHandler }
							aria-describedby={ inputDescriptionId }
						/>
						<VisuallyHidden>
							<p id={ inputDescriptionId }>
								{ __(
									'Press the ENTER key to submit or the ESCAPE key to cancel.'
								) }
							</p>
						</VisuallyHidden>
					</span>
					{ blockInformation?.anchor && (
						<span className="block-editor-list-view-block-node__anchor-wrapper">
							<Truncate
								className="block-editor-list-view-block-node__anchor"
								ellipsizeMode="auto"
							>
								{ blockInformation.anchor }
							</Truncate>
						</span>
					) }
					{ isLocked && (
						<span className="block-editor-list-view-block-node__lock">
							<Icon icon={ lock } />
						</span>
					) }
				</HStack>
			</div>
		);
	}
);

export default ListViewBlockInput;
