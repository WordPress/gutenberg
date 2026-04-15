( function () {
	const { createElement: el } = wp.element;
	const { useSelect } = wp.data;
	const {
		Modal,
		Button,
		__experimentalVStack: VStack,
		__experimentalHStack: HStack,
	} = wp.components;
	const { __ } = wp.i18n;
	const { registerPlugin } = wp.plugins;

	function CustomConnectionLimitModal() {
		const connectionStatus = useSelect( function ( select ) {
			return select( 'core' ).getSyncConnectionStatus() || null;
		}, [] );

		const error =
			connectionStatus &&
			connectionStatus.status === 'disconnected' &&
			connectionStatus.error
				? connectionStatus.error
				: null;

		if ( ! error || error.code !== 'connection-limit-exceeded' ) {
			return null;
		}

		return el(
			Modal,
			{
				title: __( 'Collaboration limit reached' ),
				isDismissible: false,
				onRequestClose() {},
				shouldCloseOnClickOutside: false,
				shouldCloseOnEsc: false,
				size: 'medium',
			},
			el(
				VStack,
				{ spacing: 6 },
				el(
					'p',
					null,
					'Consider upgrading your hosting plan to increase the collaboration limits.'
				),
				el(
					HStack,
					{ justify: 'right' },
					el(
						Button,
						{
							variant: 'tertiary',
							isDestructive: true,
							href: 'edit.php',
							__next40pxDefaultSize: true,
						},
						__( 'Back to Posts' )
					),
					el(
						Button,
						{
							variant: 'primary',
							href: 'https://example.com/upgrade',
							__next40pxDefaultSize: true,
						},
						__( 'Upgrade Plan' )
					)
				)
			)
		);
	}

	registerPlugin( 'custom-sync-connection-error', {
		render: CustomConnectionLimitModal,
	} );
} )();
