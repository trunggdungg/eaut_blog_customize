import { onWillStart, useState } from "@odoo/owl";
import { BaseOptionComponent, useDomState } from "@html_builder/core/utils";

/** Nạp danh sách blog và bài viết để admin chọn nguồn. */
function useCompanySource(component) {
    const { fetchBlogs, fetchPosts } = component.dependencies.companyBlogOption;
    const source = useState({ blogs: [], posts: [] });
    onWillStart(async () => {
        const [blogs, posts] = await Promise.all([fetchBlogs(), fetchPosts()]);
        source.blogs.push(...blogs);
        source.posts.push(...posts);
    });
    return source;
}

class CompanySourceOption extends BaseOptionComponent {
    static dependencies = ["companyBlogOption"];

    setup() {
        super.setup();
        this.source = useCompanySource(this);
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

export class CompanyActivitiesOption extends BaseOptionComponent {
    static template = "blog_company.CompanyActivitiesOption";
    static selector = ".s_company_activities";
}

export class CompanyColumnOption extends CompanySourceOption {
    static template = "blog_company.CompanyColumnOption";
    static selector = ".s_company_col";
}

export class CompanyNewsBlocksOption extends BaseOptionComponent {
    static template = "blog_company.CompanyNewsBlocksOption";
    static selector = ".s_company_news_blocks";
}

export class CompanyNewsCardOption extends CompanySourceOption {
    static template = "blog_company.CompanyNewsCardOption";
    static selector = ".s_company_news_card";
}

export class CompanyMostViewedOption extends BaseOptionComponent {
    static template = "blog_company.CompanyMostViewedOption";
    static selector = ".s_company_most_viewed";
    static dependencies = ["companyBlogOption"];

    setup() {
        super.setup();
        this.source = useCompanySource(this);
    }
}
