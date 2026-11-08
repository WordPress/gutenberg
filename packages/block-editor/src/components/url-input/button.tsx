import type { FormEvent } from 'react';
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import {
	Button,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { link, keyboardReturn, arrowLeft } from '@wordpress/icons';
import URLInput from './';
import type { URLInputButtonProps } from './types';

/**
 * A button that toggles a URL input field for inserting or editing links.
 *
 * @param props          Component properties.
 * @param props.url      The current URL value.
 * @param props.onChange Callback function to handle URL changes.
 * @return The URL input button component.
 */
function URLInputButton( { url, onChange }: URLInputButtonProps ) {
	const [ expanded, toggleExpanded ] = useReducer(
		( isExpanded ) => ! isExpanded,
		false
	);

	const submitLink = ( event: FormEvent ) => {
		event.preventDefault();
		toggleExpanded();
	};

	return (
		<div className="block-editor-url-input__button">
			<Button
				size="compact"
				icon={ link }
				label={ url ? __( 'Edit link' ) : __( 'Insert link' ) }
				onClick={ toggleExpanded }
				className="components-toolbar__control"
				isPressed={ !! url }
			/>
			{ expanded && (
				<form
					className="block-editor-url-input__button-modal"
					onSubmit={ submitLink }
				>
					<div className="block-editor-url-input__button-modal-line">
						<Button
							__next40pxDefaultSize
							className="block-editor-url-input__back"
							icon={ arrowLeft }
							label={ __( 'Close' ) }
							onClick={ toggleExpanded }
						/>
						<URLInput
							value={ url || '' }
							onChange={ onChange }
							suffix={
								<InputControlSuffixWrapper variant="control">
									<Button
										size="small"
										icon={ keyboardReturn }
										label={ __( 'Apply' ) }
										type="submit"
									/>
								</InputControlSuffixWrapper>
							}
						/>
					</div>
				</form>
			) }
		</div>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 */
export default URLInputButton;
