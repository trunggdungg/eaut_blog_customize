import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";

/**
 * Lớp nền: đọc cấu hình từ data-* của phần tử, gọi route của controller để lấy
 * HTML đã render bằng QWeb rồi đổ vào vùng nội dung (không cho sửa tay).
 */
class CompanyFetchInteraction extends Interaction {
    static endpoint = "";
    static bodySelector = "";

    /** @returns {Object} tham số query gửi lên controller */
    getParams() {
        return {};
    }

    async willStart() {
        const url = new URL(this.constructor.endpoint, window.location.origin);
        for (const [key, value] of Object.entries(this.getParams())) {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value);
            }
        }
        const response = await this.waitFor(fetch(url));
        this.html = response.ok ? await this.waitFor(response.text()) : "";
    }

    start() {
        const bodyEl = this.el.querySelector(this.constructor.bodySelector);
        if (!bodyEl) {
            return;
        }
        const doc = new DOMParser().parseFromString(this.html, "text/html");
        bodyEl.replaceChildren(...doc.body.childNodes);
        // Không để nội dung động bị lưu vào trang khi admin bấm Lưu.
        this.registerCleanup(() => bodyEl.replaceChildren());
    }
}

/**
 * Đăng ký ở cả 3 chế độ: xem thường, chỉnh sửa (editor) và xem trước (hộp thoại
 * chèn khối). Lớp nền đăng ký dạng abstract để builder không báo thiếu mixin.
 */
function registerInteraction(name, InteractionClass) {
    registry.category("public.interactions").add(name, InteractionClass);
    registry.category("public.interactions.edit").add(name, { Interaction: InteractionClass });
    registry.category("public.interactions.preview").add(name, { Interaction: InteractionClass });
}
for (const mode of ["edit", "preview"]) {
    registry
        .category(`public.interactions.${mode}`)
        .add("eaut_blog_customize.fetch_base", { Interaction: CompanyFetchInteraction, isAbstract: true });
}

/** Một cột của snippet "Hoạt động công ty". */
export class CompanyColumn extends CompanyFetchInteraction {
    static selector = ".s_company_col";
    static endpoint = "/eaut_blog_customize/column";
    static bodySelector = ".s_company_col_body";

    getParams() {
        const d = this.el.dataset;
        return {
            blog_id: d.blogId,
            mode: d.mode,
            post_id: d.postId,
            show_image: d.showImage === "true",
            show_date: d.showDate === "true",
            show_teaser: d.showTeaser === "true",
        };
    }
}
registerInteraction("eaut_blog_customize.column", CompanyColumn);

/** Một card của snippet "Tin tức theo thể loại". */
export class CompanyNewsCard extends CompanyFetchInteraction {
    static selector = ".s_company_news_card";
    static endpoint = "/eaut_blog_customize/category";
    static bodySelector = ".s_company_news_body";

    getParams() {
        const d = this.el.dataset;
        return {
            blog_id: d.blogId,
            mode: d.mode,
            post_id: d.postId,
            limit: d.limit,
            show_image: d.showImage === "true",
            show_date: d.showDate === "true",
            viewall_label: d.viewallLabel,
        };
    }
}
registerInteraction("eaut_blog_customize.news_card", CompanyNewsCard);

/** Hộp "Xem nhiều" ở thanh bên trang chi tiết bài viết. */
export class CompanyMostViewed extends CompanyFetchInteraction {
    static selector = ".s_company_most_viewed";
    static endpoint = "/eaut_blog_customize/most_viewed";
    static bodySelector = ".s_company_most_viewed_body";

    getParams() {
        const d = this.el.dataset;
        return {
            blog_id: d.blogId,
            limit: d.limit,
            show_date: d.showDate === "true",
        };
    }
}
registerInteraction("eaut_blog_customize.most_viewed", CompanyMostViewed);

/** Mũi tên chuyển cột của snippet "Hoạt động công ty". */
export class CompanyActivities extends Interaction {
    static selector = ".s_company_activities";
    dynamicContent = {
        ".s_company_prev": {
            "t-on-click": () => this.step(-1),
            "t-att-class": () => ({ s_company_arrow_hidden: !this.canScroll() || this.atStart() }),
        },
        ".s_company_next": {
            "t-on-click": () => this.step(1),
            "t-att-class": () => ({ s_company_arrow_hidden: !this.canScroll() || this.atEnd() }),
        },
        ".s_company_cols": {
            "t-on-scroll": () => {},
        },
        _window: {
            "t-on-resize": () => {},
        },
    };

    get colsEl() {
        return this.el.querySelector(".s_company_cols");
    }
    canScroll() {
        const el = this.colsEl;
        return !!el && el.scrollWidth > el.clientWidth + 1;
    }
    atStart() {
        return this.colsEl.scrollLeft <= 1;
    }
    atEnd() {
        const el = this.colsEl;
        return el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    }
    step(direction) {
        const colEl = this.colsEl.querySelector(".s_company_col");
        if (!colEl) {
            return;
        }
        this.colsEl.scrollBy({ left: direction * colEl.getBoundingClientRect().width, behavior: "smooth" });
    }
}
registerInteraction("eaut_blog_customize.activities", CompanyActivities);
