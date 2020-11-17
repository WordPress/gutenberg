export default [
	{
		id: 'block-19',
		id_base: 'block',
		sidebar: 'sidebar-1',
		widget_class: 'WP_Widget_Block',
		name: 'Block',
		description: 'Gutenberg block.',
		number: 19,
		rendered:
			'<section id="block-19" class="widget widget_block">\n<p>First Paragraph</p>\n</section>',
		rendered_form:
			'<p>First Paragraph</p>\n\t\t<br/>\n\t\t<textarea id="widget-block-19-content" name="widget-block[19][content]"\n\t\t\t\tclass="content sync-input" hidden>&lt;!-- wp:paragraph --&gt;\n&lt;p&gt;First Paragraph&lt;/p&gt;\n&lt;!-- /wp:paragraph --&gt;</textarea>\n\t\t<script>\n\t\t\t(function() {\n\t\t\t\tvar link = "http://localhost:8888/wp-admin/themes.php?page=gutenberg-widgets";\n\t\t\t\tvar container = jQuery(\'#widget-block-19-content\').closest(".form").find(\'.widget-control-actions .alignleft\');\n\t\t\t\tcontainer.prepend(jQuery(\'<span> |</span>\'));\n\t\t\t\tcontainer.prepend(jQuery(\'<a href="\'+link+\'" class="button-link">Edit</a>\'));\n\t\t\t})();\n\t\t</script>',
		settings: {
			content:
				'<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->',
		},
	},
	{
		id: 'recent-posts-6',
		id_base: 'recent-posts',
		sidebar: 'sidebar-1',
		widget_class: 'WP_Widget_Recent_Posts',
		name: 'Recent Posts',
		description: 'Your site&#8217;s most recent Posts.',
		number: 6,
		rendered:
			'<section id="recent-posts-6" class="widget widget_recent_entries">\n\t\t<h2 class="widget-title">Recent Posts</h2><nav role="navigation" aria-label="Recent Posts">\n\t\t<ul>\n\t\t\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t<a href="http://localhost:8888/?p=76">Title</a>\n\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t<a href="http://localhost:8888/?p=1">Hello world!</a>\n\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t</ul>\n\n\t\t</nav></section>',
		rendered_form:
			'<p>\n\t\t\t<label for="widget-recent-posts-6-title">Title:</label>\n\t\t\t<input class="widefat" id="widget-recent-posts-6-title" name="widget-recent-posts[6][title]" type="text" value="Recent Posts" />\n\t\t</p>\n\n\t\t<p>\n\t\t\t<label for="widget-recent-posts-6-number">Number of posts to show:</label>\n\t\t\t<input class="tiny-text" id="widget-recent-posts-6-number" name="widget-recent-posts[6][number]" type="number" step="1" min="1" value="5" size="3" />\n\t\t</p>\n\n\t\t<p>\n\t\t\t<input class="checkbox" type="checkbox" id="widget-recent-posts-6-show_date" name="widget-recent-posts[6][show_date]" />\n\t\t\t<label for="widget-recent-posts-6-show_date">Display post date?</label>\n\t\t</p>',
		settings: { title: 'Recent Posts', number: 5, show_date: false },
	},
	{
		id: 'search-5',
		id_base: 'search',
		sidebar: 'sidebar-1',
		widget_class: 'WP_Widget_Search',
		name: 'Search',
		description: 'A search form for your site.',
		number: 5,
		rendered:
			'<section id="search-5" class="widget widget_search"><h2 class="widget-title">Search</h2><form role="search"  method="get" class="search-form" action="http://localhost:8888/">\n\t<label for="search-form-1">Search&hellip;</label>\n\t<input type="search" id="search-form-1" class="search-field" value="" name="s" />\n\t<input type="submit" class="search-submit" value="Search" />\n</form>\n</section>',
		rendered_form:
			'<p>\n\t\t\t<label for="widget-search-5-title">Title:</label>\n\t\t\t<input class="widefat" id="widget-search-5-title" name="widget-search[5][title]" type="text" value="Search" />\n\t\t</p>',
		settings: { title: 'Search' },
	},
	{
		id: 'block-20',
		id_base: 'block',
		sidebar: 'sidebar-1',
		widget_class: 'WP_Widget_Block',
		name: 'Block',
		description: 'Gutenberg block.',
		number: 20,
		rendered:
			'<section id="block-20" class="widget widget_block">\n<p>Second Paragraph</p>\n</section>',
		rendered_form:
			'<p>Second Paragraph</p>\n\t\t<br/>\n\t\t<textarea id="widget-block-20-content" name="widget-block[20][content]"\n\t\t\t\tclass="content sync-input" hidden>&lt;!-- wp:paragraph --&gt;\n&lt;p&gt;Second Paragraph&lt;/p&gt;\n&lt;!-- /wp:paragraph --&gt;</textarea>\n\t\t<script>\n\t\t\t(function() {\n\t\t\t\tvar link = "http://localhost:8888/wp-admin/themes.php?page=gutenberg-widgets";\n\t\t\t\tvar container = jQuery(\'#widget-block-20-content\').closest(".form").find(\'.widget-control-actions .alignleft\');\n\t\t\t\tcontainer.prepend(jQuery(\'<span> |</span>\'));\n\t\t\t\tcontainer.prepend(jQuery(\'<a href="\'+link+\'" class="button-link">Edit</a>\'));\n\t\t\t})();\n\t\t</script>',
		settings: {
			content:
				'<!-- wp:paragraph -->\n<p>Second Paragraph</p>\n<!-- /wp:paragraph -->',
		},
	},
];
