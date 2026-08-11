import {
	Button,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useMediaEditor } from '../../state';
import { getSourceRegion } from '../../image-editor';

/**
 * The width and height being typed, before they are committed.
 *
 * Held locally so the fields stay put while someone edits them. Committing
 * on every keystroke would push a history entry per character, and a
 * half-typed width (`3` on the way to `320`) would scale the image to the
 * minimum and then back out again.
 */
interface ScaleDraft {
	width: string;
	height: string;
}

/**
 * Width and height fields for scaling the whole image before it is cropped.
 *
 * The two fields are linked: the image only scales as a whole, so editing one
 * derives the other from the source's aspect ratio. Values commit on blur or
 * Enter, producing a single undo entry per edit.
 *
 * The numbers are the size of the *image*, not of the file that gets saved.
 * When a crop is in play the saved file is smaller, so the resulting size is
 * spelled out underneath rather than left for the user to work out.
 */
export default function MediaEditorScaleControl() {
	const { state, setScaledSize } = useMediaEditor();
	const [ draft, setDraft ] = useState< ScaleDraft | null >( null );

	const image = state.image;
	const naturalWidth = image?.naturalWidth ?? 0;
	const naturalHeight = image?.naturalHeight ?? 0;

	// What the fields show when nobody is typing: the scaled size if one is
	// set, otherwise the size the image came in at.
	const committed = useMemo(
		() =>
			state.scaledSize ?? {
				width: naturalWidth,
				height: naturalHeight,
			},
		[ state.scaledSize, naturalWidth, naturalHeight ]
	);

	// The size the `/edit` request will actually produce: the crop applied to
	// the scaled image. `getSourceRegion` scales linearly with the image size
	// it is given, so passing the scaled size yields the saved dimensions.
	const savedSize = useMemo( () => {
		if ( ! image ) {
			return null;
		}
		const region = getSourceRegion( state, committed );
		return {
			width: Math.round( region.width ),
			height: Math.round( region.height ),
		};
	}, [ state, image, committed ] );

	// Only worth showing when it differs from the size in the fields —
	// otherwise it repeats the numbers directly above it.
	const showSavedSize =
		savedSize !== null &&
		( savedSize.width !== committed.width ||
			savedSize.height !== committed.height );

	if ( ! image || naturalWidth <= 0 || naturalHeight <= 0 ) {
		return null;
	}

	const handleChange = ( axis: 'width' | 'height', next: string ) => {
		const current = draft ?? {
			width: String( committed.width ),
			height: String( committed.height ),
		};
		const parsed = parseInt( next, 10 );

		// Leave the linked field alone until there's a number to derive it
		// from, so clearing a field doesn't blank both.
		if ( ! Number.isFinite( parsed ) || parsed <= 0 ) {
			setDraft( { ...current, [ axis ]: next } );
			return;
		}

		setDraft(
			axis === 'width'
				? {
						width: next,
						height: String(
							Math.round(
								( parsed * naturalHeight ) / naturalWidth
							)
						),
				  }
				: {
						width: String(
							Math.round(
								( parsed * naturalWidth ) / naturalHeight
							)
						),
						height: next,
				  }
		);
	};

	const commit = () => {
		if ( ! draft ) {
			return;
		}
		const width = parseInt( draft.width, 10 );
		const height = parseInt( draft.height, 10 );

		// An empty or nonsense entry reverts to the committed value rather
		// than scaling to something the user didn't ask for.
		if (
			Number.isFinite( width ) &&
			Number.isFinite( height ) &&
			width > 0 &&
			height > 0
		) {
			setScaledSize( { width, height } );
		}
		setDraft( null );
	};

	const handleKeyDown = ( event: ReactKeyboardEvent< HTMLInputElement > ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			commit();
		}
	};

	const shown = draft ?? {
		width: String( committed.width ),
		height: String( committed.height ),
	};

	// `max` carries the "no scaling up" rule on its own. NumberControl only
	// applies it on commit — Enter, blur, arrow keys and drag — never while
	// typing, so a larger number can still be entered a digit at a time and
	// snaps back when the field is left. It also caps the increment arrows
	// and gives assistive tech the range for free.
	// `spinControls` is left at its default of `native`. The `custom`
	// variant renders real buttons, which take focus and blur the field, so
	// every arrow click would commit the value from before the click.
	const sharedFieldProps = {
		step: 1,
		min: 1,
		onBlur: commit,
		onKeyDown: handleKeyDown,
	};

	return (
		<Stack
			className="media-editor-scale-control"
			direction="column"
			gap="xs"
		>
			<Stack
				className="media-editor-scale-control__fields"
				direction="row"
				gap="sm"
			>
				<NumberControl
					label={ __( 'Width' ) }
					value={ shown.width }
					max={ naturalWidth }
					onChange={ ( next?: string ) =>
						handleChange( 'width', next ?? '' )
					}
					{ ...sharedFieldProps }
				/>
				<NumberControl
					label={ __( 'Height' ) }
					value={ shown.height }
					max={ naturalHeight }
					onChange={ ( next?: string ) =>
						handleChange( 'height', next ?? '' )
					}
					{ ...sharedFieldProps }
				/>
			</Stack>
			<Button
				className="media-editor-scale-control__reset"
				variant="secondary"
				size="compact"
				disabled={ state.scaledSize === null }
				accessibleWhenDisabled
				onClick={ () => {
					setDraft( null );
					setScaledSize( null );
				} }
			>
				{ __( 'Reset to original' ) }
			</Button>
			<Text variant="body-sm">
				{ __( 'Scaling applies to the whole image, before any crop.' ) }
			</Text>
			{ showSavedSize && (
				<Text variant="body-sm">
					{ sprintf(
						/* translators: 1: image width in pixels, 2: image height in pixels. */
						__( 'Saved size: %1$d × %2$d pixels.' ),
						savedSize.width,
						savedSize.height
					) }
				</Text>
			) }
		</Stack>
	);
}
