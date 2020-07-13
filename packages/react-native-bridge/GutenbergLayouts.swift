import Foundation

struct GutenbergPageLayouts {
    let layouts: [GutenbergLayout]
    let categories: [GutenbergLayoutCategory]
}

struct GutenbergLayout {
    let slug: String
    let title: String
    let preview: String
    let categories: [GutenbergLayoutCategory]
}

struct GutenbergLayoutCategory {
    let slug: String
    let title: String
    let description: String
    let emoji: String
}

class GutenbergPageLayoutFactory {

    //MARK: - Factory Method

    /// Creates a a default set of Page Layout templates to be used on for creating starter pages layouts.
    /// - Returns: A default `GutenbergPageLayouts` object that contains a default set of layouts and categories
    static func makeDefaultPageLayouts() -> GutenbergPageLayouts {
        let defaultLayouts = makeDefaultLayouts()
        let defaultCategories = makeDefaultCategories()
        return GutenbergPageLayouts(layouts: defaultLayouts, categories: defaultCategories)
    }


    //MARK: - Define Categories
    private static var aboutCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "about",
                                title: NSLocalizedString("About", comment: "Category name for page templates"),
                                description: NSLocalizedString("About pages", comment: "Category description for page templates"),
                                emoji: "👋")
    }

    private static var blogCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "blog",
                                title: NSLocalizedString("Blog", comment: "Category name for page templates"),
                                description: NSLocalizedString("Blog pages", comment: "Category description for page templates"),
                                emoji: "📰")
    }

    private static var contactCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "contact",
                                title: NSLocalizedString("Contact", comment: "Category name for page templates"),
                                description: NSLocalizedString("Contact pages", comment: "Category description for page templates"),
                                emoji: "📫")
    }

    private static var portfolioCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "portfolio",
                                title: NSLocalizedString("Portfolio", comment: "Category name for page templates"),
                                description: NSLocalizedString("Portfolio pages", comment: "Category description for page templates"),
                                emoji: "🎨")
    }

    private static var servicesCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "services",
                                title: NSLocalizedString("Services", comment: "Category name for page templates"),
                                description: NSLocalizedString("Services pages", comment: "Category description for page templates"),
                                emoji: "🔧")
    }

    private static var teamCategory: GutenbergLayoutCategory {
        GutenbergLayoutCategory(slug: "team",
                                title: NSLocalizedString("Team", comment: "Category name for page templates"),
                                description: NSLocalizedString("Team pages", comment: "Category description for page templates"),
                                emoji: "👥")
    }

    /// Creates a a default set of Categories templates to be used on for creating starter pages layouts.
    private static func makeDefaultCategories() -> [GutenbergLayoutCategory] {
        return [aboutCategory, blogCategory, contactCategory, portfolioCategory, servicesCategory, teamCategory]
    }

    //MARK: - Define layouts
    /// Creates a a default set of Layout meta data to be used on for creating starter pages layouts.
    private static func makeDefaultLayouts() -> [GutenbergLayout] {
        return [
            GutenbergLayout(slug: "about",
                            title: NSLocalizedString("About", comment: "About page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2020/01/about-2.png",
                            categories: [aboutCategory]),
            GutenbergLayout(slug: "blog",
                            title: NSLocalizedString("Blog", comment: "Blog page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2019/06/blog-4.png",
                            categories: [blogCategory]),
            GutenbergLayout(slug: "contact",
                            title: NSLocalizedString("Contact", comment: "Contact page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2019/06/contact-2.png",
                            categories: [contactCategory]),
            GutenbergLayout(slug: "portfolio",
                            title: NSLocalizedString("Portfolio", comment: "Portfolio page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2019/06/portfolio-2.png",
                            categories: [portfolioCategory]),
            GutenbergLayout(slug: "services",
                            title: NSLocalizedString("Services", comment: "Services page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2019/06/services-2.png",
                            categories: [servicesCategory]),
            GutenbergLayout(slug: "team",
                            title: NSLocalizedString("Team", comment: "Team page type template title"),
                            preview: "https://headstartdata.files.wordpress.com/2020/03/team.png",
                            categories: [teamCategory])
        ]
    }
}
