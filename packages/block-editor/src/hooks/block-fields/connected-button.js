/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { forwardRef, useContext } from '@wordpress/element';
import { connection, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockContext from '../../components/block-context';
import { useBlockEditContext } from '../../components/block-edit';
import {
	BlockBindingsSourceFieldsList,
	useBlockBindingsCompatibleFields,
} from '../../components/block-bindings';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Bare `<Button>` rendered as the Block Bindings indicator/trigger. Kept
 * deliberately free of wrappers so it can be passed to
 * `Menu.TriggerButton render={ <ConnectedButton ... /> }`: Ariakit places
 * `aria-expanded`, `aria-haspopup`, ref, and keyboard handlers on this
 * `<button>` directly. The same element is rendered in both bound and
 * unbound states (only `icon` and `label` change), preserving the
 * no-remount guarantee from spec req 4 / AC2.
 *
 * Exported as both named and default for backwards compatibility with the
 * cherry-pick's `import ConnectedButton from './connected-button';`.
 *
 * @param {Object}  props
 * @param {boolean} props.isConnected Whether the field is currently bound.
 */
export const ConnectedButton = forwardRef(
	( { isConnected, ...props }, ref ) => {
		const label = isConnected ? __( 'Disconnect' ) : __( 'Connect' );

		return (
			<Button
				ref={ ref }
				{ ...props }
				size="small"
				icon={ isConnected ? connection : linkOff }
				iconSize={ 24 }
				label={ label }
			/>
		);
	}
);

export default ConnectedButton;

/**
 * Suffix-wrapped variant of `ConnectedButton` for DataForm controls that
 * render inside an `InputControl`-aware container (the auto-suffix path in
 * `block-fields/index.js`). The wrapper sits OUTSIDE the Ariakit trigger
 * boundary so it does not collect `aria-expanded`.
 *
 * @param {Object} props Same props as `ConnectedButton`.
 */
export function ConnectedButtonSuffix( props ) {
	return (
		<InputControlSuffixWrapper variant="control">
			<ConnectedButton { ...props } />
		</InputControlSuffixWrapper>
	);
}

/**
 * Interactive Block Bindings picker mounted next to a Block Field.
 *
 * Consumes `useBlockBindingsCompatibleFields` (the single gate predicate)
 * and returns `null` when the field is not bindable. Otherwise it renders
 * a `Menu` whose trigger is the bare `ConnectedButton` and whose popover
 * reuses `BlockBindingsSourceFieldsList` verbatim (spec req 6).
 *
 * The disconnect interaction is delegated to `BlockBindingsSourceFieldsList`'s
 * existing `Menu.CheckboxItem` semantics (re-select the checked item to
 * disconnect — spec req 8, AC5).
 *
 * @param {Object}  props
 * @param {string}  props.attribute   The block attribute name.
 * @param {string}  props.blockName   The block name (e.g. 'core/paragraph').
 * @param {boolean} props.isConnected Whether the attribute is bound.
 * @param {boolean} [props.asSuffix]  When true, wrap the trigger in
 *                                    `InputControlSuffixWrapper` for the
 *                                    DataForm auto-suffix path.
 */
export function GatedConnectedButton( {
	attribute,
	blockName,
	isConnected,
	asSuffix = false,
} ) {
	const { clientId } = useBlockEditContext();
	const blockContext = useContext( BlockContext );
	const isMobile = useViewportMatch( 'medium', '<' );
	const { isBindable, compatibleFields } = useBlockBindingsCompatibleFields(
		attribute,
		blockName,
		blockContext
	);
	const binding = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.metadata
				?.bindings?.[ attribute ],
		[ clientId, attribute ]
	);

	if ( ! isBindable ) {
		return null;
	}

	const trigger = (
		<Menu.TriggerButton
			render={ <ConnectedButton isConnected={ isConnected } /> }
		/>
	);

	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ asSuffix ? (
				<InputControlSuffixWrapper variant="control">
					{ trigger }
				</InputControlSuffixWrapper>
			) : (
				trigger
			) }
			<Menu.Popover gutter={ isMobile ? 8 : 36 }>
				<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
					{ Object.entries( compatibleFields ).map(
						( [ sourceKey, fields ] ) => (
							<BlockBindingsSourceFieldsList
								key={ sourceKey }
								args={ binding?.args }
								attribute={ attribute }
								sourceKey={ sourceKey }
								fields={ fields }
							/>
						)
					) }
				</Menu>
			</Menu.Popover>
		</Menu>
	);
}
