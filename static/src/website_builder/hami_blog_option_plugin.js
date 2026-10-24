import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { SNIPPET_SPECIFIC } from "@html_builder/utils/option_sequence";
import { registry } from "@web/core/registry";
import {
    HamiActivitiesOption,
    HamiColumnOption,
    HamiNewsBlocksOption,
    HamiNewsCardOption,
        HamiMostViewedOption,
} from "./hami_blog_options";

class HamiBlogOptionPlugin extends Plugin {
    static id = "hamiBlogOption";
    static shared = ["fetchBlogs", "fetchPosts"];
    /** @type {import("plugins").WebsiteResources} */
    resources = {
        builder_options: [
            withSequence(SNIPPET_SPECIFIC, HamiActivitiesOption),
            withSequence(SNIPPET_SPECIFIC, HamiColumnOption),
            withSequence(SNIPPET_SPECIFIC, HamiNewsBlocksOption),
            withSequence(SNIPPET_SPECIFIC, HamiNewsCardOption),
                withSequence(SNIPPET_SPECIFIC, HamiMostViewedOption),
        ],
           // Cho phép kéo đổi thứ tự cột (snippet "Hoạt động HAMI"). Card của
        // "Tin tức theo thể loại" là `.row > div` nên builder đã cho kéo sẵn.
        is_movable_selector: { selector: ".s_hami_cols > .s_hami_col", direction: "horizontal" },
        // Nội dung nạp lúc chạy không được lưu cứng vào trang.
        clean_for_save_handlers: ({ root }) => {
               const bodySelector = ".s_hami_col_body, .s_hami_news_body, .s_hami_most_viewed_body";
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

registry.category("website-plugins").add(HamiBlogOptionPlugin.id, HamiBlogOptionPlugin);
