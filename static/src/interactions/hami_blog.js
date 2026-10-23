import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";

/**
 * Lớp nền: đọc cấu hình từ data-* của phần tử, gọi route của controller để lấy
 * HTML đã render bằng QWeb rồi đổ vào vùng nội dung (không cho sửa tay).
 */
class HamiFetchInteraction extends Interaction {
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

function registerInteraction(name, InteractionClass) {
    registry.category("public.interactions").add(name, InteractionClass);
    registry.category("public.interactions.edit").add(name, { Interaction: InteractionClass });
    registry.category("public.interactions.preview").add(name, { Interaction: InteractionClass });
}

/** Một cột của snippet "Hoạt động HAMI". */
export class HamiColumn extends HamiFetchInteraction {
    static selector = ".s_hami_col";
    static endpoint = "/hami_blog/column";
    static bodySelector = ".s_hami_col_body";

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
registerInteraction("hami_blog.column", HamiColumn);

/** Một card của snippet "Tin tức theo thể loại". */
export class HamiNewsCard extends HamiFetchInteraction {
    static selector = ".s_hami_news_card";
    static endpoint = "/hami_blog/category";
    static bodySelector = ".s_hami_news_body";

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
registerInteraction("hami_blog.news_card", HamiNewsCard);

/** Snippet "Xem nhiều". */
export class HamiMostViewed extends HamiFetchInteraction {
    static selector = ".s_hami_most_viewed";
    static endpoint = "/hami_blog/most_viewed";
    static bodySelector = ".s_hami_most_viewed_body";

    getParams() {
        const d = this.el.dataset;
        return {
            blog_id: d.blogId,
            limit: d.limit,
            show_date: d.showDate === "true",
        };
    }
}
registerInteraction("hami_blog.most_viewed", HamiMostViewed);

/** Mũi tên chuyển cột của snippet "Hoạt động HAMI". */
export class HamiActivities extends Interaction {
    static selector = ".s_hami_activities";
    dynamicContent = {
        ".s_hami_prev": {
            "t-on-click": () => this.step(-1),
            "t-att-class": () => ({ s_hami_arrow_hidden: !this.canScroll() || this.atStart() }),
        },
        ".s_hami_next": {
            "t-on-click": () => this.step(1),
            "t-att-class": () => ({ s_hami_arrow_hidden: !this.canScroll() || this.atEnd() }),
        },
        ".s_hami_cols": {
            "t-on-scroll": () => {},
        },
        _window: {
            "t-on-resize": () => {},
        },
    };

    get colsEl() {
        return this.el.querySelector(".s_hami_cols");
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
        const colEl = this.colsEl.querySelector(".s_hami_col");
        if (!colEl) {
            return;
        }
        this.colsEl.scrollBy({ left: direction * colEl.getBoundingClientRect().width, behavior: "smooth" });
    }
}
registerInteraction("hami_blog.activities", HamiActivities);
