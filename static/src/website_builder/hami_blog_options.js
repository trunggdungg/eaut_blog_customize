import { onWillStart, useState } from "@odoo/owl";
import { BaseOptionComponent, useDomState } from "@html_builder/core/utils";

/** Nạp danh sách blog và bài viết để admin chọn nguồn. */
function useHamiSource(component) {
    const { fetchBlogs, fetchPosts } = component.dependencies.hamiBlogOption;
    const source = useState({ blogs: [], posts: [] });
    onWillStart(async () => {
        const [blogs, posts] = await Promise.all([fetchBlogs(), fetchPosts()]);
        source.blogs.push(...blogs);
        source.posts.push(...posts);
    });
    return source;
}

class HamiSourceOption extends BaseOptionComponent {
    static dependencies = ["hamiBlogOption"];

    setup() {
        super.setup();
        this.source = useHamiSource(this);
        this.state = useDomState((el) => ({
            mode: el.dataset.mode || "latest",
            blogId: parseInt(el.dataset.blogId ?? "-1"),
        }));
    }

    /** Bài viết thuộc blog đang chọn (hoặc tất cả nếu chọn "Tất cả blog"). */
    get manualPosts() {
        const blogId = this.state.blogId;
        return this.source.posts.filter((post) => blogId < 0 || post.blog_id[0] === blogId);
    }
}

export class HamiActivitiesOption extends BaseOptionComponent {
    static template = "hami_blog.HamiActivitiesOption";
    static selector = ".s_hami_activities";
}

export class HamiColumnOption extends HamiSourceOption {
    static template = "hami_blog.HamiColumnOption";
    static selector = ".s_hami_col";
}

export class HamiNewsBlocksOption extends BaseOptionComponent {
    static template = "hami_blog.HamiNewsBlocksOption";
    static selector = ".s_hami_news_blocks";
}

export class HamiNewsCardOption extends HamiSourceOption {
    static template = "hami_blog.HamiNewsCardOption";
    static selector = ".s_hami_news_card";
}

export class HamiMostViewedOption extends BaseOptionComponent {
    static template = "hami_blog.HamiMostViewedOption";
    static selector = ".s_hami_most_viewed";
    static dependencies = ["hamiBlogOption"];

    setup() {
        super.setup();
        this.source = useHamiSource(this);
    }
}

export class HamiCtaOption extends BaseOptionComponent {
    static template = "hami_blog.HamiCtaOption";
    static selector = ".s_hami_cta";
}
