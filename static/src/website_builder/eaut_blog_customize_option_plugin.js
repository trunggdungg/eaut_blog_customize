import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { SNIPPET_SPECIFIC } from "@html_builder/utils/option_sequence";
import { registry } from "@web/core/registry";
import {
    CompanyActivitiesOption,
    CompanyColumnOption,
    CompanyNewsBlocksOption,
    CompanyNewsCardOption,
    CompanyMostViewedOption,
} from "./eaut_blog_customize_options";

class CompanyBlogOptionPlugin extends Plugin {
    static id = "companyBlogOption";
    static shared = ["fetchBlogs", "fetchPosts"];
    /** @type {import("plugins").WebsiteResources} */
    resources = {
        builder_options: [
            withSequence(SNIPPET_SPECIFIC, CompanyActivitiesOption),
            withSequence(SNIPPET_SPECIFIC, CompanyColumnOption),
            withSequence(SNIPPET_SPECIFIC, CompanyNewsBlocksOption),
            withSequence(SNIPPET_SPECIFIC, CompanyNewsCardOption),
            withSequence(SNIPPET_SPECIFIC, CompanyMostViewedOption),
        ],
        // Cho phép kéo đổi thứ tự cột (snippet "Hoạt động công ty"). Card của
        // "Tin tức theo thể loại" là `.row > div` nên builder đã cho kéo sẵn.
        is_movable_selector: { selector: ".s_company_cols > .s_company_col", direction: "horizontal" },
        // Nội dung nạp lúc chạy không được lưu cứng vào trang.
        clean_for_save_handlers: ({ root }) => {
            const bodySelector = ".s_company_col_body, .s_company_news_body, .s_company_most_viewed_body";
            for (const bodyEl of root.querySelectorAll(bodySelector)) {
                bodyEl.replaceChildren();
            }
        },
    };

    setup() {
        this.blogs = undefined;
        this.posts = undefined;
    }

    get websiteDomain() {
        return [
            "|",
            ["website_id", "=", false],
            ["website_id", "=", this.services.website.currentWebsite.id],
        ];
    }

    async fetchBlogs() {
        if (!this.blogs) {
            this.blogs = this.services.orm.searchRead("blog.blog", this.websiteDomain, [
                "id",
                "name",
            ]);
        }
        return this.blogs;
    }

    async fetchPosts() {
        if (!this.posts) {
            this.posts = this.services.orm.searchRead(
                "blog.post",
                [...this.websiteDomain, ["website_published", "=", true]],
                ["id", "name", "blog_id"],
                { limit: 300, order: "post_date desc" }
            );
        }
        return this.posts;
    }
}

registry.category("website-plugins").add(CompanyBlogOptionPlugin.id, CompanyBlogOptionPlugin);
