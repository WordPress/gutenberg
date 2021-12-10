package com.gutenberg

/*
From:
let result = await fetch(`https://public-api.wordpress.com/wpcom/v2/common-block-layouts/?supported_blocks=core%2Fparagraph%2Ccore%2Fheading%2Ccore%2Fmore%2Ccore%2Fimage%2Ccore%2Fvideo%2Ccore%2Fnextpage%2Ccore%2Fseparator%2Ccore%2Flist%2Ccore%2Fquote%2Ccore%2Fmedia-text%2Ccore%2Fpreformatted%2Ccore%2Fgallery%2Ccore%2Fcolumns%2Ccore%2Fcolumn%2Ccore%2Fgroup%2Ccore%2Ffreeform%2Ccore%2Fbutton%2Ccore%2Fspacer%2Ccore%2Fshortcode%2Ccore%2Fbuttons%2Ccore%2Flatest-posts%2Ccore%2Fverse%2Ccore%2Fcover%2Ccore%2Fsocial-link%2Ccore%2Fsocial-links%2Ccore%2Fpullquote%2Ccore%2Ffile%2Ccore%2Fsearch%2Ccore%2Fblock%2Cjetpack%2Fcontact-info%2Cjetpack%2Femail%2Cjetpack%2Fphone%2Cjetpack%2Faddress&preview_width=440.0&preview_height=660.0&scale=1.0&type=mobile&is_beta=true`).then(r => r.json())
with content "pruned" with:
let pruned = {...result, layouts: result.layouts.map(l => ({...l, content: ""}))}
 */

class Patterns {
    companion object {
        val gutenbergCategories: List<GutenbergLayoutCategory> = listOf(
            GutenbergLayoutCategory(
                slug = "blog",
                title = "Blog",
                description = "Blog pages",
                emoji = "📰",
            ),
            GutenbergLayoutCategory(
                slug = "about",
                title = "About",
                description = "About pages",
                emoji = "👋",
            ),
            GutenbergLayoutCategory(
                slug = "links",
                title = "Links",
                description = "Links pages",
                emoji = "🔗",
            ),
            GutenbergLayoutCategory(
                slug = "splash",
                title = "Splash",
                description = "Splash pages",
                emoji = "🏖",
            ),
            GutenbergLayoutCategory(
                slug = "highlights",
                title = "Highlights",
                description = "Highlights pages",
                emoji = "💛",
            ),
            GutenbergLayoutCategory(
                slug = "portfolio",
                title = "Portfolio",
                description = "Portfolio pages",
                emoji = "🎨",
            ),
            GutenbergLayoutCategory(
                slug = "contact",
                title = "Contact",
                description = "Contact pages",
                emoji = "📫",
            ),
            GutenbergLayoutCategory(
                slug = "team",
                title = "Team",
                description = "Team pages",
                emoji = "👥",
            ),
            GutenbergLayoutCategory(
                slug = "services",
                title = "Services",
                description = "Service pages",
                emoji = "🔧",
            ),
            GutenbergLayoutCategory(
                slug = "home",
                title = "Home",
                description = "Home pages",
                emoji = "🏠",
            ),
            GutenbergLayoutCategory(
                slug = "gallery",
                title = "Gallery",
                description = "Gallery pages",
                emoji = "🖼",
            )
        )

        val categories = gutenbergCategories.map { LayoutCategoryModel(it) }

        val layouts = listOf(GutenbergLayout(
            slug = "menu-2",
            title = "Menu",
            content = "",
            categories = gutenbergCategories.filter { it.slug == "services" },
            demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=4133&language=en",
            preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4133%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
            previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4133%26language%3Den?vpw=800&vph=1200&w=440&h=660",
            previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4133%26language%3Den?vpw=400&vph=600&w=440&h=660"
        ),
            GutenbergLayout(
                slug = "contact-with-info",
                title = "Contact",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "contact" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=4073&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4073%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4073%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D4073%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "blog-9",
                title = "Blog",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "blog" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3685&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3685%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3685%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3685%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "blog-8",
                title = "Blog",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "blog" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3681&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3681%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3681%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3681%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "favorites-2",
                title = "Favorites",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "highlights" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3676&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3676%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3676%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3676%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "favorites",
                title = "Favorites",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "highlights" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3670&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3670%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3670%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3670%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "coming-soon-3",
                title = "Coming Soon",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "splash" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3665&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3665%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3665%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3665%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "coming-soon-2",
                title = "Coming Soon",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "splash" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3662&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3662%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3662%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3662%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-11",
                title = "About",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3658&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3658%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3658%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3658%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-10",
                title = "About",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3654&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3654%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3654%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3654%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "links",
                title = "Links",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "links" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3649&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3649%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3649%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3649%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-9",
                title = "Links",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "links" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3644&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3644%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3644%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3644%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "reynolds-2",
                title = "Reynolds",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3504&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3504%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3504%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3504%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "vesta-2",
                title = "Vesta",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3498&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3498%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3498%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3498%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "overton-2",
                title = "Overton",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3490&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3490%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3490%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3490%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "easley-2",
                title = "Easley",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3486&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3486%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3486%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3486%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "leven-2",
                title = "Leven",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3477&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3477%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3477%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3477%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "brice-2",
                title = "Brice",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3470&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3470%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3470%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3470%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "bowen-2",
                title = "Bowen",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3467&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3467%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3467%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3467%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "cassel-2",
                title = "Cassel",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3440&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3440%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3440%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3440%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "barnsbury-2",
                title = "Barnsbury",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3432&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3432%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3432%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3432%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "alves-2",
                title = "Alves",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3424&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3424%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3424%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3424%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "team-3",
                title = "Team",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "team" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3413&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3413%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3413%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3413%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "blog-7",
                title = "Blog",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "blog" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3395&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3395%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3395%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3395%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "services-6",
                title = "Services",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "services" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3392&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3392%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3392%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3392%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "portfolio-10",
                title = "Portfolio",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "portfolio" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3383&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3383%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3383%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3383%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "portfolio-9",
                title = "Portfolio",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "portfolio" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3380&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3380%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3380%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3380%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "contact-12",
                title = "Contact",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "contact" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3372&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3372%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3372%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3372%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-7",
                title = "About",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3342&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3342%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3342%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3342%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "team-2",
                title = "Team",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "team" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3360&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3360%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3360%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3360%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-6",
                title = "About",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3353&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3353%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3353%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3353%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "mayland",
                title = "Mayland",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "gallery" || it.slug == "home" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=3099&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3099%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3099%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D3099%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "contact-9",
                title = "Contact",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=1403&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1403%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1403%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1403%26language%3Den?vpw=400&vph=600&w=440&h=660"
            ),
            GutenbergLayout(
                slug = "about-3",
                title = "About",
                content = "",
                categories = gutenbergCategories.filter { it.slug == "about" },
                demoUrl = "https://public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com?use_patterns=true&post_id=1340&language=en",
                preview = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1340%26language%3Den?vpw=1200&vph=1800&w=440&h=660",
                previewTablet = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1340%26language%3Den?vpw=800&vph=1200&w=440&h=660",
                previewMobile = "https://s0.wp.com/mshots/v1/public-api.wordpress.com/rest/v1/template/demo/Hever/dotcompatterns.wordpress.com%3Fuse_patterns%3Dtrue%26post_id%3D1340%26language%3Den?vpw=400&vph=600&w=440&h=660"
            )
        ).map { LayoutModel(it) }
    }
}
