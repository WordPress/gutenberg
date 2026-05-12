/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { CropInputRange } from './crop-input-utils';
import { useDeferredCommit } from './use-deferred-commit';

export interface CropInputProps {
	label: string;
	'aria-label'?: string;
	value: number;
	range: CropInputRange;
	disabled?: boolean;
	/** Display step used by the underlying NumberControl (arrow-key increment). */
	step?: number;
	/** Snap granularity applied when a value is committed. Defaults to `step`. */
	commitStep?: number;
	suffix?: React.ReactNode;
	onCommit: ( value: number ) => void;
	onCommitEnd?: () => void;
}

const PX_SUFFIX = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

/**
 * Numeric crop control with live preview and deferred finalization.
 *
 * All of the focus / draft / idle / Enter / Escape state lives in
 * `useDeferredCommit`; this component just renders.
 *
 * @param props Component props.
 * @return Rendered number control.
 */
export default function CropInput( props: CropInputProps ) {
	const {
		label,
		'aria-label': ariaLabel,
		value,
		range,
		disabled = false,
		step = 1,
		commitStep = step,
		suffix = PX_SUFFIX,
		onCommit,
		onCommitEnd,
	} = props;
	const handlers = useDeferredCommit( {
		value,
		range,
		commitStep,
		onCommit,
		onCommitEnd,
	} );

	return (
		<NumberControl
			__next40pxDefaultSize
			label={ label }
			aria-label={ ariaLabel }
			step={ step }
			disabled={ disabled }
			suffix={ suffix }
			{ ...handlers }
		/>
	);
}
