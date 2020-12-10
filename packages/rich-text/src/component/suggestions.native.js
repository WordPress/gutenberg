/**
 * WordPress dependencies
 */
import { Picker, Toolbar, ToolbarButton } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { atSymbol, Icon, plus } from '@wordpress/icons';

export default function SuggestionToolbarButton( {
	areMentionsSupported,
	areXPostsSupported,
	onUserSuggestionsTriggered,
	onXPostsTriggered,
} ) {
	const picker = useRef();
	function presentPicker() {
		if ( picker.current ) {
			picker.current.presentPicker();
		}
	}

	const mentionKey = 'mention';
	const xpostKey = 'xpost';
	function onSuggestionTypeSelected( suggestionType ) {
		switch ( suggestionType ) {
			case mentionKey:
				onUserSuggestionsTriggered();
				break;
			case xpostKey:
				onXPostsTriggered();
				break;
			default:
				break;
		}
	}

	return (
		( areMentionsSupported || areXPostsSupported ) && (
			<>
				<Toolbar>
					<ToolbarButton
						title={
							areMentionsSupported
								? __( 'Insert mention' )
								: __( 'Insert crosspost' )
						}
						icon={
							<Icon
								icon={ areMentionsSupported ? atSymbol : plus }
							/>
						}
						onClick={
							areMentionsSupported
								? onUserSuggestionsTriggered
								: onXPostsTriggered
						}
						onLongPress={
							areMentionsSupported &&
							areXPostsSupported &&
							presentPicker
						}
					/>
				</Toolbar>
				{ areMentionsSupported && areXPostsSupported && (
					<Picker
						ref={ picker }
						options={ [
							{
								value: mentionKey,
								label: __( 'Mention' ),
								icon: atSymbol,
							},
							{
								value: xpostKey,
								label: __( 'Crosspost' ),
								icon: plus,
							},
						] }
						onChange={ onSuggestionTypeSelected }
						hideCancelButton
					/>
				) }
			</>
		)
	);
}
