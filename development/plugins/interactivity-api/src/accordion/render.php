<div
	data-wp-interactive="interactiveAccordion"
	data-wp-context='{ "isOpen": false }'
	class="interactivity-api-accordion">
	<h3 class="interactivity-api-accordion-title">
		<button
			data-wp-on--click="actions.toggle"
			class="interactivity-api-accordion-title_action"
		>
			<?= esc_html($attributes['title']) ?>
		</button>
	</h3>
	<div
		data-wp-bind--hidden="context.isOpen"
		class="interactivity-api-accordion-content"
	>
		<?= wp_kses_post($content) ?>
	</div>
</div>
